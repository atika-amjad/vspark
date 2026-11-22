import { fieldErrors, loginSchema, passwordSchema, profileSchema, transactionIdSchema } from "../src/lib/validation";

let failures = 0;
function check(name: string, ok: boolean) {
  console.log(ok ? "PASS" : "FAIL", name);
  if (!ok) failures++;
}

const good = { fullName: "Ali Khan", phone: "03001234567", email: "Ali@Gmail.com", university: "COMSATS University Islamabad", department: "Computer Science", regNo: "FA23-BSE-039" };
const parsed = profileSchema.safeParse(good);
check("valid profile passes and email is lowercased", parsed.success && parsed.data.email === "ali@gmail.com");
check("+92 phone accepted", profileSchema.safeParse({ ...good, phone: "+923001234567" }).success);
check("bad phone rejected", !profileSchema.safeParse({ ...good, phone: "12345" }).success);
check("short name rejected", !profileSchema.safeParse({ ...good, fullName: "A" }).success);
check("bad email rejected", !profileSchema.safeParse({ ...good, email: "nope" }).success);
check("bad registration number rejected", !profileSchema.safeParse({ ...good, regNo: "!!" }).success);
const bad = profileSchema.safeParse({ ...good, phone: "1", email: "x" });
check("fieldErrors maps failing fields", !bad.success && Boolean(fieldErrors(bad.error).phone) && Boolean(fieldErrors(bad.error).email));
check("valid password accepted", passwordSchema.safeParse({ password: "abc12345", confirmPassword: "abc12345" }).success);
check("password mismatch rejected", !passwordSchema.safeParse({ password: "abc12345", confirmPassword: "abc12346" }).success);
check("password without digit rejected", !passwordSchema.safeParse({ password: "abcdefgh", confirmPassword: "abcdefgh" }).success);
check("short password rejected", !passwordSchema.safeParse({ password: "a1", confirmPassword: "a1" }).success);
check("valid transaction id accepted", transactionIdSchema.safeParse("TXN-123456").success);
check("transaction id with special characters rejected", !transactionIdSchema.safeParse("12345; DROP").success);
check("login accepts valid input", loginSchema.safeParse({ email: "a@b.co", password: "x" }).success);

console.log(failures ? `${failures} FAILED` : "ALL PASSED");
process.exit(failures ? 1 : 0);
