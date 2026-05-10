import { z } from "zod";
import { ReferralPriority, SpecialtyType } from "@referrals/shared";

// Step 1
export const step1Schema = z.object({
  patientId: z.string().uuid("Please select a patient."),
  specialtyType: z.nativeEnum(SpecialtyType, {
    errorMap: () => ({ message: "Please select a specialty." }),
  }),
});

// Step 2
export const step2Schema = z.object({
  clinicalReason: z
    .string()
    .min(10, "Clinical reason must be at least 10 characters.")
    .max(2000),
  icd10Codes: z
    .string()
    .min(3, "Enter at least one ICD-10 code (e.g. Z00.00).")
    .max(500),
});

// Step 3 — documents are uploaded separately; no required fields here
export const step3Schema = z.object({});

// Step 4
export const step4Schema = z.object({
  priority: z.nativeEnum(ReferralPriority, {
    errorMap: () => ({ message: "Please select a priority." }),
  }),
  requestedTimeframe: z.string().optional(),
  specialistId: z.string().uuid().optional().or(z.literal("")),
});

// Full schema (all steps merged)
export const createReferralSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);

export type CreateReferralFormValues = z.infer<typeof createReferralSchema>;

// Per-step schema map used by the wizard to validate on Next
export const STEP_SCHEMAS = [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
] as const;
