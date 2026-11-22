// Usage: npm run seed
// Inserts starter competitions, events, blog posts and results (idempotent: upsert by id).
// Review and edit the text below before running; you can also manage everything from /admin.
import { supabaseScriptClient } from "./_supabase.mjs";

const db = supabaseScriptClient();

const year = new Date().getFullYear() + 1;

const competitions = [
  { id: "speed-programming", title: "Speed Programming", category: "Programming", maxTeamSize: 1, description: "Solve algorithmic problems as fast and accurately as you can in a timed contest.", fee: 500, prize: "Cash prize + certificates", teamSize: "Individual", venue: "CS Lab 1" },
  { id: "web-development", title: "Web Development", category: "Development", maxTeamSize: 2, description: "Build a working web application from a surprise brief within the time limit.", fee: 1000, prize: "Cash prize + internship opportunity", teamSize: "Teams of up to 2", venue: "CS Lab 2" },
  { id: "ai-prompting", title: "AI Prompting", category: "Artificial Intelligence", maxTeamSize: 1, description: "Craft prompts that get the best results from AI tools on a set of practical challenges.", fee: 500, prize: "Cash prize + certificates", teamSize: "Individual", venue: "Seminar Hall" },
  { id: "e-gaming", title: "E-Gaming Tournament", category: "Gaming", maxTeamSize: 4, description: "Compete in a campus e-gaming tournament with knockout rounds.", fee: 700, prize: "Cash prize + trophies", teamSize: "Individual / Squads", venue: "Gaming Arena" },
];

const events = [
  { id: "opening-ceremony", title: "Opening Ceremony", description: "Welcome address, rules briefing and competition kick-off.", date: `${year}-12-10`, time: "9:00 AM", venue: "Main Auditorium" },
  { id: "web-workshop", title: "Modern Web Workshop", description: "Hands-on session on building and deploying full-stack web apps.", date: `${year}-12-10`, time: "11:30 AM", venue: "Seminar Hall" },
  { id: "closing-ceremony", title: "Prize Distribution", description: "Results announcement and prize distribution.", date: `${year}-12-11`, time: "3:00 PM", venue: "Main Auditorium" },
];

const blogs = [
  { id: "welcome-to-vspark", title: "Welcome to VSpark", category: "Blog Post", excerpt: "What VSpark is and what to expect from this year's event.", author: "VSpark Team", date: `${year - 1}-11-01`, content: "VSpark is a national-level coding competition and innovation showcase hosted by the CS Department at COMSATS University Islamabad, Vehari Campus.\n\nThe event brings together students from different universities to compete in programming, web development, AI prompting and e-gaming." },
  { id: "registration-guide", title: "How to register for VSpark", category: "Blog Post", excerpt: "A quick walkthrough of the registration and approval process.", author: "VSpark Team", date: `${year - 1}-11-05`, content: "Create an account, choose your competitions, transfer the fee and upload your payment proof.\n\nAn admin reviews every registration. Once approved, your account is unlocked and you can register for more competitions." },
];

const results = [];

async function seed(table, docs) {
  if (!docs.length) return;
  const { error } = await db.from(table).upsert(docs, { onConflict: "id" });
  if (error) {
    console.error(`✖ ${table}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✔ ${table}: ${docs.length} row(s)`);
}

await seed("competitions", competitions);
await seed("events", events);
await seed("blogs", blogs);
await seed("results", results);
console.log("Done.");

