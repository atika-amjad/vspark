import { z } from "zod";

export const DEPARTMENTS = [
  "Computer Science",
  "Software Engineering",
  "Information Technology",
  "Data Science",
  "Artificial Intelligence",
  "Electrical Engineering",
  "Other",
] as const;

export const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

const PHONE_RE = /^(\+92|0)3\d{9}$/;
const REG_NO_RE = /^[A-Za-z0-9][A-Za-z0-9\-/ ]{3,29}$/;
const TXN_RE = /^[A-Za-z0-9\-_]{6,40}$/;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100, "Name is too long"),
  phone: z
    .string()
    .trim()
    .regex(PHONE_RE, "Enter a valid Pakistani mobile number, e.g. 03001234567"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  university: z.string().trim().min(2, "Select or enter your university").max(150),
  department: z.string().trim().min(2, "Select your department").max(100),
  regNo: z
    .string()
    .trim()
    .regex(REG_NO_RE, "Enter a valid registration number, e.g. FA23-BSE-039"),
});

export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(/[A-Za-z]/, "Password must contain a letter")
      .regex(/\d/, "Password must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const competitionSelectionSchema = z.object({
  competitionIds: z.array(z.string()).min(1, "Select at least one competition").max(10),
});

export const transactionIdSchema = z
  .string()
  .trim()
  .regex(TXN_RE, "Transaction ID must be 6-40 letters, numbers, - or _");

/** Converts a failed zod parse into a { field: message } map (first message per field). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function validateProofFile(file: File): string | null {
  if (!(ALLOWED_PROOF_TYPES as readonly string[]).includes(file.type)) {
    return "Proof must be a JPG, PNG, WebP image or a PDF.";
  }
  if (file.size > MAX_PROOF_BYTES) return "Proof file must be 5 MB or smaller.";
  if (file.size === 0) return "The selected file is empty.";
  return null;
}
