// Usage: npm run make-admin -- someone@example.com
// Grants admin rights by inserting a row in the admins table.
// The user must already have signed up through the website.
import { supabaseScriptClient } from "./_supabase.mjs";

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}

const db = supabaseScriptClient();

async function findUserId() {
  const { data: profile } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (profile?.id) return profile.id;

  // Fall back to scanning auth users (profile row may be missing).
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

const uid = await findUserId();
if (!uid) {
  console.error(`No account found for ${email}. Register on the website first, then run this again.`);
  process.exit(1);
}

const { error } = await db.from("admins").upsert({ userId: uid, createdAt: new Date().toISOString() }, { onConflict: "userId" });
if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}
console.log(`✔ ${email} (uid ${uid}) is now an admin.`);
