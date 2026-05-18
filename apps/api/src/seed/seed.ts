import "reflect-metadata";
import { DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";
import { join } from "path";
import * as dotenv from "dotenv";
import {
  ReferralStatus,
  ReferralPriority,
  SpecialtyType,
  UserRole,
  AuthorizationStatus,
} from "@referrals/shared";

dotenv.config({ path: join(__dirname, "..", "..", "..", ".env") });

const ds = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST ?? "localhost",
  port: parseInt(process.env.POSTGRES_PORT ?? "5432", 10),
  username: process.env.POSTGRES_USER ?? "referrals",
  password: process.env.POSTGRES_PASSWORD ?? "referrals_secret",
  database: process.env.POSTGRES_DB ?? "referrals_db",
  entities: [join(__dirname, "..", "**", "*.entity.{ts,js}")],
  synchronize: false,
});

// Enum type names — match what the migrations actually created.
// TypeORM renames enums to "<table>_<column>_enum" when it takes ownership.
const E = {
  userRole: "users_role_enum",
  refStatus: "referrals_status_enum",
  refPriority: "referrals_priority_enum",
  specialty: "referrals_specialtytype_enum",
  stepStatus: "referral_steps_status_enum",
  authStatus: "authorization_requests_status_enum",
  spSpecialty: "specialist_profiles_specialtytype_enum",
} as const;

// Helpers
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * TypeORM @Column('simple-array') stores arrays as a comma-joined plain text
 * string in Postgres. Insert them that way, not as a PG array literal.
 */
function toSimpleArray(arr: string[]): string {
  return arr.join(",");
}

// Insurance plans
const INSURANCE_PLAN_DATA = [
  {
    payerId: "BCBS-PPO",
    planName: "BlueCross PPO",
    planType: "PPO",
    preAuthRequiredFor: toSimpleArray([
      SpecialtyType.CARDIOLOGY,
      SpecialtyType.NEUROLOGY,
      SpecialtyType.ONCOLOGY,
    ]),
  },
  {
    payerId: "CMS-MA",
    planName: "Medicare Advantage",
    planType: "HMO",
    preAuthRequiredFor: toSimpleArray([
      SpecialtyType.CARDIOLOGY,
      SpecialtyType.ORTHOPEDICS,
      SpecialtyType.NEUROLOGY,
      SpecialtyType.ONCOLOGY,
      SpecialtyType.RADIOLOGY,
      SpecialtyType.PULMONOLOGY,
    ]),
  },
  {
    payerId: "AETNA-HMO",
    planName: "Aetna HMO",
    planType: "HMO",
    preAuthRequiredFor: toSimpleArray([
      SpecialtyType.CARDIOLOGY,
      SpecialtyType.ORTHOPEDICS,
      SpecialtyType.NEUROLOGY,
      SpecialtyType.ONCOLOGY,
      SpecialtyType.DERMATOLOGY,
      SpecialtyType.RHEUMATOLOGY,
    ]),
  },
  {
    payerId: "UHC-PPO",
    planName: "United PPO",
    planType: "PPO",
    preAuthRequiredFor: toSimpleArray([
      SpecialtyType.CARDIOLOGY,
      SpecialtyType.ONCOLOGY,
      SpecialtyType.NEUROLOGY,
    ]),
  },
  {
    payerId: "CIGNA-HMO",
    planName: "Cigna HMO",
    planType: "HMO",
    preAuthRequiredFor: toSimpleArray([
      SpecialtyType.CARDIOLOGY,
      SpecialtyType.ORTHOPEDICS,
      SpecialtyType.NEUROLOGY,
      SpecialtyType.ONCOLOGY,
      SpecialtyType.RADIOLOGY,
      SpecialtyType.ENDOCRINOLOGY,
    ]),
  },
  {
    payerId: "CMS",
    planName: "Medicare",
    planType: "MEDICARE",
    preAuthRequiredFor: toSimpleArray([
      SpecialtyType.ONCOLOGY,
      SpecialtyType.RADIOLOGY,
    ]),
  },
  {
    payerId: "AETNA-PPO",
    planName: "Aetna PPO",
    planType: "PPO",
    preAuthRequiredFor: toSimpleArray([
      SpecialtyType.CARDIOLOGY,
      SpecialtyType.ONCOLOGY,
    ]),
  },
  {
    payerId: "HUMANA-GOLD",
    planName: "Humana Gold",
    planType: "HMO",
    preAuthRequiredFor: toSimpleArray([
      SpecialtyType.CARDIOLOGY,
      SpecialtyType.ORTHOPEDICS,
      SpecialtyType.NEUROLOGY,
      SpecialtyType.ONCOLOGY,
      SpecialtyType.PULMONOLOGY,
    ]),
  },
];

// Users
const PHYSICIANS = [
  {
    fullName: "Dr. Sarah Chen",
    email: "sarah.chen@clinic.com",
    role: UserRole.PHYSICIAN,
  },
  {
    fullName: "Dr. Marcus Williams",
    email: "marcus.williams@clinic.com",
    role: UserRole.PHYSICIAN,
  },
  {
    fullName: "Dr. Priya Patel",
    email: "priya.patel@clinic.com",
    role: UserRole.NURSE_PRACTITIONER,
  },
];

const ADMIN = {
  fullName: "Admin Staff",
  email: "admin@clinic.com",
  role: UserRole.ADMIN_STAFF,
};

// Each entry carries profile fields (specialtyType, zip, etc.) alongside user
// fields so a single source of truth feeds both `users` and `specialist_profiles`.
const SPECIALISTS: Array<{
  fullName: string;
  email: string;
  role: UserRole;
  specialtyType: SpecialtyType;
  zipCode: string;
  spokenLanguages: string[];
  nextAvailableSlotDays: number;
  isAcceptingReferrals: boolean;
  acceptedPlanNames: string[];
}> = [
  {
    fullName: "Dr. James Hartley",
    email: "j.hartley@cardiology.com",
    role: UserRole.SPECIALIST,
    specialtyType: SpecialtyType.CARDIOLOGY,
    zipCode: "60601",
    spokenLanguages: ["English", "Spanish"],
    nextAvailableSlotDays: 14,
    isAcceptingReferrals: true,
    acceptedPlanNames: [
      "BlueCross PPO",
      "Aetna PPO",
      "United PPO",
      "Aetna HMO",
      "Humana Gold",
    ],
  },
  {
    fullName: "Dr. Elena Rossi",
    email: "e.rossi@dermatology.com",
    role: UserRole.SPECIALIST,
    specialtyType: SpecialtyType.DERMATOLOGY,
    zipCode: "60614",
    spokenLanguages: ["English", "Italian"],
    nextAvailableSlotDays: 21,
    isAcceptingReferrals: true,
    acceptedPlanNames: [
      "BlueCross PPO",
      "Aetna PPO",
      "Aetna HMO",
      "United PPO",
      "Medicare",
      "Medicare Advantage",
    ],
  },
  {
    fullName: "Dr. David Kim",
    email: "d.kim@ortho.com",
    role: UserRole.SPECIALIST,
    specialtyType: SpecialtyType.ORTHOPEDICS,
    zipCode: "60611",
    spokenLanguages: ["English", "Korean"],
    nextAvailableSlotDays: 10,
    isAcceptingReferrals: true,
    acceptedPlanNames: [
      "BlueCross PPO",
      "Aetna PPO",
      "United PPO",
      "Cigna HMO",
      "Medicare",
      "Medicare Advantage",
    ],
  },
  {
    fullName: "Dr. Amara Osei",
    email: "a.osei@neuro.com",
    role: UserRole.SPECIALIST,
    specialtyType: SpecialtyType.NEUROLOGY,
    zipCode: "60607",
    spokenLanguages: ["English", "French"],
    nextAvailableSlotDays: 28,
    isAcceptingReferrals: true,
    acceptedPlanNames: [
      "BlueCross PPO",
      "Aetna PPO",
      "Aetna HMO",
      "United PPO",
      "Medicare",
    ],
  },
  {
    fullName: "Dr. Yuki Tanaka",
    email: "y.tanaka@radiology.com",
    role: UserRole.SPECIALIST,
    specialtyType: SpecialtyType.RADIOLOGY,
    zipCode: "60612",
    spokenLanguages: ["English", "Japanese"],
    nextAvailableSlotDays: 5,
    isAcceptingReferrals: true,
    acceptedPlanNames: [
      "BlueCross PPO",
      "Aetna PPO",
      "Aetna HMO",
      "United PPO",
      "Cigna HMO",
      "Medicare",
      "Medicare Advantage",
      "Humana Gold",
    ],
  },
  {
    fullName: "Dr. Carlos Mendez",
    email: "c.mendez@gastro.com",
    role: UserRole.SPECIALIST,
    specialtyType: SpecialtyType.GASTROENTEROLOGY,
    zipCode: "60605",
    spokenLanguages: ["English", "Spanish"],
    nextAvailableSlotDays: 18,
    isAcceptingReferrals: true,
    acceptedPlanNames: [
      "BlueCross PPO",
      "Aetna PPO",
      "United PPO",
      "Medicare",
      "Medicare Advantage",
      "Humana Gold",
    ],
  },
  {
    fullName: "Dr. Fatima Al-Hassan",
    email: "f.alhassan@endo.com",
    role: UserRole.SPECIALIST,
    specialtyType: SpecialtyType.ENDOCRINOLOGY,
    zipCode: "60616",
    spokenLanguages: ["English", "Arabic"],
    nextAvailableSlotDays: 30,
    isAcceptingReferrals: true,
    acceptedPlanNames: [
      "BlueCross PPO",
      "Aetna PPO",
      "Aetna HMO",
      "United PPO",
      "Cigna HMO",
      "Medicare",
    ],
  },
  {
    fullName: "Dr. Robert Nguyen",
    email: "r.nguyen@pulm.com",
    role: UserRole.SPECIALIST,
    specialtyType: SpecialtyType.PULMONOLOGY,
    zipCode: "60608",
    spokenLanguages: ["English", "Vietnamese"],
    nextAvailableSlotDays: 12,
    isAcceptingReferrals: true,
    acceptedPlanNames: [
      "BlueCross PPO",
      "Aetna PPO",
      "United PPO",
      "Medicare",
      "Medicare Advantage",
      "Cigna HMO",
    ],
  },
  {
    fullName: "Dr. Sophia Ivanova",
    email: "s.ivanova@rheum.com",
    role: UserRole.SPECIALIST,
    specialtyType: SpecialtyType.RHEUMATOLOGY,
    zipCode: "60610",
    spokenLanguages: ["English", "Russian"],
    nextAvailableSlotDays: 35,
    isAcceptingReferrals: true,
    acceptedPlanNames: [
      "BlueCross PPO",
      "Aetna PPO",
      "Aetna HMO",
      "United PPO",
      "Medicare",
      "Humana Gold",
    ],
  },
  {
    fullName: "Dr. Benjamin Okafor",
    email: "b.okafor@oncology.com",
    role: UserRole.SPECIALIST,
    specialtyType: SpecialtyType.ONCOLOGY,
    zipCode: "60603",
    spokenLanguages: ["English"],
    nextAvailableSlotDays: 7,
    isAcceptingReferrals: true,
    acceptedPlanNames: [
      "BlueCross PPO",
      "Aetna PPO",
      "Aetna HMO",
      "United PPO",
      "Cigna HMO",
      "Medicare",
      "Medicare Advantage",
      "Humana Gold",
    ],
  },
];

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------
const PATIENT_DATA: Array<{
  mrn: string;
  fullName: string;
  dateOfBirth: string;
  insurancePlanName: string;
  insuranceMemberId: string;
  phone: string;
  email: string;
}> = [
  {
    mrn: "MRN-001",
    fullName: "Alice Thompson",
    dateOfBirth: "1988-03-15",
    insurancePlanName: "BlueCross PPO",
    insuranceMemberId: "BCX-4421",
    phone: "555-0101",
    email: "alice.t@email.com",
  },
  {
    mrn: "MRN-002",
    fullName: "Robert Martinez",
    dateOfBirth: "1972-11-22",
    insurancePlanName: "Medicare Advantage",
    insuranceMemberId: "MCR-7732",
    phone: "555-0102",
    email: "rmartinez@email.com",
  },
  {
    mrn: "MRN-003",
    fullName: "Patricia Johnson",
    dateOfBirth: "1975-07-08",
    insurancePlanName: "Aetna HMO",
    insuranceMemberId: "AET-9912",
    phone: "555-0103",
    email: "pjohnson@email.com",
  },
  {
    mrn: "MRN-004",
    fullName: "Michael Davis",
    dateOfBirth: "1988-01-30",
    insurancePlanName: "United PPO",
    insuranceMemberId: "UHC-2240",
    phone: "555-0104",
    email: "mdavis@email.com",
  },
  {
    mrn: "MRN-005",
    fullName: "Linda Wilson",
    dateOfBirth: "1963-09-14",
    insurancePlanName: "Cigna HMO",
    insuranceMemberId: "CGN-5531",
    phone: "555-0105",
    email: "lwilson@email.com",
  },
  {
    mrn: "MRN-006",
    fullName: "James Anderson",
    dateOfBirth: "1945-05-20",
    insurancePlanName: "Medicare",
    insuranceMemberId: "MCR-0012",
    phone: "555-0106",
    email: "j.anderson@email.com",
  },
  {
    mrn: "MRN-007",
    fullName: "Barbara Taylor",
    dateOfBirth: "1970-12-03",
    insurancePlanName: "BlueCross PPO",
    insuranceMemberId: "BCX-6678",
    phone: "555-0107",
    email: "btaylor@email.com",
  },
  {
    mrn: "MRN-008",
    fullName: "William Jackson",
    dateOfBirth: "1980-04-17",
    insurancePlanName: "Aetna PPO",
    insuranceMemberId: "AET-3348",
    phone: "555-0108",
    email: "wjackson@email.com",
  },
  {
    mrn: "MRN-009",
    fullName: "Elizabeth White",
    dateOfBirth: "1957-08-29",
    insurancePlanName: "Humana Gold",
    insuranceMemberId: "HMN-8821",
    phone: "555-0109",
    email: "ewhite@email.com",
  },
  {
    mrn: "MRN-010",
    fullName: "David Harris",
    dateOfBirth: "1992-02-11",
    insurancePlanName: "United PPO",
    insuranceMemberId: "UHC-4409",
    phone: "555-0110",
    email: "dharris@email.com",
  },
];

// ---------------------------------------------------------------------------
// Referral scenarios
// ---------------------------------------------------------------------------
const REFERRAL_SCENARIOS: Array<{
  specialtyType: SpecialtyType;
  clinicalReason: string;
  icd10Codes: string;
  status: ReferralStatus;
  priority: ReferralPriority;
  authStatus?: AuthorizationStatus;
}> = [
  {
    specialtyType: SpecialtyType.CARDIOLOGY,
    clinicalReason:
      "Patient presenting with exertional chest pain and dyspnea. ECG shows ST changes. Requires cardiology evaluation and stress testing.",
    icd10Codes: "I20.9, R07.4, R06.09",
    status: ReferralStatus.CLOSED,
    priority: ReferralPriority.URGENT,
    authStatus: AuthorizationStatus.APPROVED,
  },
  {
    specialtyType: SpecialtyType.DERMATOLOGY,
    clinicalReason:
      "Suspicious pigmented lesion on left forearm, 8mm, irregular borders. ABCDE criteria concerning. Needs biopsy evaluation.",
    icd10Codes: "D22.62, L57.0",
    status: ReferralStatus.SCHEDULING,
    priority: ReferralPriority.URGENT,
    authStatus: AuthorizationStatus.APPROVED,
  },
  {
    specialtyType: SpecialtyType.ORTHOPEDICS,
    clinicalReason:
      "Right knee pain following sports injury. MRI shows meniscal tear. Conservative management failed. Requesting surgical consultation.",
    icd10Codes: "M23.201, S83.201A",
    status: ReferralStatus.SUBMITTED,
    priority: ReferralPriority.ROUTINE,
    authStatus: AuthorizationStatus.APPROVED_WITH_MODIFICATIONS,
  },
  {
    specialtyType: SpecialtyType.NEUROLOGY,
    clinicalReason:
      "New onset seizure disorder. EEG abnormal. Patient requires neurological workup and medication management.",
    icd10Codes: "G40.909, R56.9",
    status: ReferralStatus.AUTHORIZATION,
    priority: ReferralPriority.URGENT,
    authStatus: AuthorizationStatus.PENDING,
  },
  {
    specialtyType: SpecialtyType.RADIOLOGY,
    clinicalReason:
      "Pulmonary nodule 7mm identified on chest CT. Fleischner Society guidelines recommend follow-up PET scan.",
    icd10Codes: "R91.1, J98.09",
    status: ReferralStatus.READY_TO_SUBMIT,
    priority: ReferralPriority.ROUTINE,
    authStatus: AuthorizationStatus.NOT_REQUIRED,
  },
  {
    specialtyType: SpecialtyType.CARDIOLOGY,
    clinicalReason:
      "Hypertensive heart disease with reduced ejection fraction (35%). Needs optimization of heart failure management and device evaluation.",
    icd10Codes: "I11.0, I50.22",
    status: ReferralStatus.CLINICAL_PREP,
    priority: ReferralPriority.URGENT,
  },
  {
    specialtyType: SpecialtyType.GASTROENTEROLOGY,
    clinicalReason:
      "Patient age 50, due for colorectal cancer screening. Family history of colon cancer (father at 55). Colonoscopy indicated.",
    icd10Codes: "Z12.11, Z80.0",
    status: ReferralStatus.INTAKE,
    priority: ReferralPriority.ROUTINE,
  },
  {
    specialtyType: SpecialtyType.ORTHOPEDICS,
    clinicalReason:
      "Left hip osteoarthritis, severe. Pain limiting ambulation. Patient failed conservative treatment x 12 months. Hip replacement consultation.",
    icd10Codes: "M16.12, M79.621",
    status: ReferralStatus.CLOSED,
    priority: ReferralPriority.ROUTINE,
    authStatus: AuthorizationStatus.APPROVED,
  },
  {
    specialtyType: SpecialtyType.NEUROLOGY,
    clinicalReason:
      "Progressive cognitive decline over 18 months. MMSE score 22/30. Rule out Alzheimer disease vs vascular dementia. MRI brain ordered.",
    icd10Codes: "G30.9, F00.9",
    status: ReferralStatus.AUTHORIZATION,
    priority: ReferralPriority.ROUTINE,
    authStatus: AuthorizationStatus.DENIED,
  },
  {
    specialtyType: SpecialtyType.ENDOCRINOLOGY,
    clinicalReason:
      "Poorly controlled Type 2 diabetes (A1C 10.2%). Multiple oral medications failed. Requires insulin initiation and diabetes education.",
    icd10Codes: "E11.65, E11.649",
    status: ReferralStatus.SUBMITTED,
    priority: ReferralPriority.ROUTINE,
    authStatus: AuthorizationStatus.NOT_REQUIRED,
  },
  {
    specialtyType: SpecialtyType.PULMONOLOGY,
    clinicalReason:
      "COPD exacerbation, 3rd hospitalization this year. Requires pulmonary function testing, inhaler optimization, and pulmonary rehab referral.",
    icd10Codes: "J44.1, J44.0",
    status: ReferralStatus.SCHEDULING,
    priority: ReferralPriority.URGENT,
    authStatus: AuthorizationStatus.APPROVED,
  },
  {
    specialtyType: SpecialtyType.RHEUMATOLOGY,
    clinicalReason:
      "Symmetric polyarthritis with morning stiffness >1 hour. RF and Anti-CCP positive. Clinical diagnosis rheumatoid arthritis, needs DMARD.",
    icd10Codes: "M05.79, M06.9",
    status: ReferralStatus.CLINICAL_PREP,
    priority: ReferralPriority.ROUTINE,
  },
  {
    specialtyType: SpecialtyType.DERMATOLOGY,
    clinicalReason:
      "Moderate-to-severe plaque psoriasis covering 30% BSA. Topical therapy failed. Requires evaluation for biologic therapy.",
    icd10Codes: "L40.0",
    status: ReferralStatus.READY_TO_SUBMIT,
    priority: ReferralPriority.ROUTINE,
    authStatus: AuthorizationStatus.PENDING,
  },
  {
    specialtyType: SpecialtyType.CARDIOLOGY,
    clinicalReason:
      "Palpitations with documented SVT on Holter monitor. Symptomatic despite beta-blocker. Electrophysiology consultation for ablation.",
    icd10Codes: "I47.1, R00.2",
    status: ReferralStatus.INTAKE,
    priority: ReferralPriority.ROUTINE,
  },
  {
    specialtyType: SpecialtyType.ONCOLOGY,
    clinicalReason:
      "Newly diagnosed breast cancer (ER+/PR+/HER2-). Lumpectomy completed. Requires oncology consultation for adjuvant chemotherapy.",
    icd10Codes: "C50.912, Z85.3",
    status: ReferralStatus.AUTHORIZATION,
    priority: ReferralPriority.STAT,
    authStatus: AuthorizationStatus.APPROVED,
  },
  {
    specialtyType: SpecialtyType.RADIOLOGY,
    clinicalReason:
      "Lower extremity deep vein thrombosis. Hypercoagulable workup positive. MRI abdomen/pelvis to rule out underlying malignancy.",
    icd10Codes: "I82.491, Z86.718",
    status: ReferralStatus.SUBMITTED,
    priority: ReferralPriority.URGENT,
    authStatus: AuthorizationStatus.APPROVED,
  },
  {
    specialtyType: SpecialtyType.NEUROLOGY,
    clinicalReason:
      "Migraine with aura, 15+ headache days/month (chronic migraine). Preventive medications failed. Consider CGRP antagonist therapy.",
    icd10Codes: "G43.709",
    status: ReferralStatus.CLOSED,
    priority: ReferralPriority.ROUTINE,
    authStatus: AuthorizationStatus.APPROVED_WITH_MODIFICATIONS,
  },
  {
    specialtyType: SpecialtyType.GASTROENTEROLOGY,
    clinicalReason:
      "Elevated liver enzymes (ALT 3x ULN) in patient with NAFLD risk factors. Requires hepatology evaluation and FibroScan.",
    icd10Codes: "K76.0, R74.01",
    status: ReferralStatus.SCHEDULING,
    priority: ReferralPriority.ROUTINE,
    authStatus: AuthorizationStatus.APPROVED,
  },
  {
    specialtyType: SpecialtyType.CARDIOLOGY,
    clinicalReason:
      "Severe aortic stenosis on echo (AVA 0.8 cm², mean gradient 45 mmHg). TAVR evaluation requested at structural heart center.",
    icd10Codes: "I35.0",
    status: ReferralStatus.AUTHORIZATION,
    priority: ReferralPriority.URGENT,
    authStatus: AuthorizationStatus.PENDING,
  },
  {
    specialtyType: SpecialtyType.ORTHOPEDICS,
    clinicalReason:
      "Carpal tunnel syndrome bilateral, severe. EMG/NCS confirms. Conservative treatment failed 6 months. Surgical release evaluation.",
    icd10Codes: "G56.01, G56.02",
    status: ReferralStatus.CLOSED,
    priority: ReferralPriority.ROUTINE,
    authStatus: AuthorizationStatus.APPROVED,
  },
];

// ---------------------------------------------------------------------------
// Step helpers
// ---------------------------------------------------------------------------
const STEP_LABELS = [
  "Intake",
  "Clinical prep",
  "Authorization",
  "Ready to submit",
  "Submitted",
  "Scheduling",
  "Closed / complete",
];

function deriveStepStatuses(status: ReferralStatus): string[] {
  const order = [
    ReferralStatus.INTAKE,
    ReferralStatus.CLINICAL_PREP,
    ReferralStatus.AUTHORIZATION,
    ReferralStatus.READY_TO_SUBMIT,
    ReferralStatus.SUBMITTED,
    ReferralStatus.SCHEDULING,
    ReferralStatus.CLOSED,
  ];
  const currentIdx = Math.max(order.indexOf(status), 0);
  return order.map((_, i) =>
    i < currentIdx ? "COMPLETE" : i === currentIdx ? "IN_PROGRESS" : "PENDING",
  );
}

// ---------------------------------------------------------------------------
// Insert one full referral record (steps + optional auth + audit entry)
// ---------------------------------------------------------------------------
async function insertReferral(
  qr: Awaited<ReturnType<typeof ds.createQueryRunner>>,
  opts: {
    patientId: string;
    providerId: string;
    specialistId: string | null;
    scenario: (typeof REFERRAL_SCENARIOS)[number];
    createdAt: Date;
  },
): Promise<void> {
  const { patientId, providerId, specialistId, scenario, createdAt } = opts;
  const ageDays = (Date.now() - createdAt.getTime()) / 86_400_000;

  const submittedAt = [
    ReferralStatus.SUBMITTED,
    ReferralStatus.SCHEDULING,
    ReferralStatus.CLOSED,
  ].includes(scenario.status)
    ? daysAgo(ageDays - 3)
    : null;
  const closedAt =
    scenario.status === ReferralStatus.CLOSED ? daysAgo(ageDays * 0.5) : null;

  const [referral] = await qr.query(
    `INSERT INTO referrals
       ("patientId","referringProviderId","specialistId",
        status,priority,"specialtyType","clinicalReason","icd10Codes",
        "submittedAt","closedAt","createdAt","updatedAt")
     VALUES ($1,$2,$3,
             $4::${E.refStatus},$5::${E.refPriority},$6::${E.specialty},
             $7,$8,$9,$10,$11,$11)
     RETURNING id`,
    [
      patientId,
      providerId,
      specialistId,
      scenario.status,
      scenario.priority,
      scenario.specialtyType,
      scenario.clinicalReason,
      scenario.icd10Codes,
      submittedAt,
      closedAt,
      createdAt,
    ],
  );

  const referralId: string = referral.id;

  for (const [idx, stepStatus] of deriveStepStatuses(
    scenario.status,
  ).entries()) {
    await qr.query(
      `INSERT INTO referral_steps
         ("referralId","stepNumber","stepCode",label,status,"completedAt","createdAt")
       VALUES ($1,$2,$3,$4,$5::${E.stepStatus},$6,$7)`,
      [
        referralId,
        idx + 1,
        `${idx + 1}a`,
        STEP_LABELS[idx],
        stepStatus,
        stepStatus === "COMPLETE" ? daysAgo(ageDays - idx * 2) : null,
        createdAt,
      ],
    );
  }

  if (
    scenario.authStatus &&
    scenario.authStatus !== AuthorizationStatus.NOT_REQUIRED
  ) {
    await qr.query(
      `INSERT INTO authorization_requests
         ("referralId",status,"authNumber","denialReason","submittedAt","resolvedAt","createdAt","updatedAt")
       VALUES ($1,$2::${E.authStatus},$3,$4,$5,$6,$7,$7)`,
      [
        referralId,
        scenario.authStatus,
        scenario.authStatus === AuthorizationStatus.APPROVED
          ? `AUTH-${Math.floor(Math.random() * 900_000 + 100_000)}`
          : null,
        scenario.authStatus === AuthorizationStatus.DENIED
          ? "Service not medically necessary per plan guidelines."
          : null,
        daysAgo(ageDays - 5),
        scenario.authStatus !== AuthorizationStatus.PENDING
          ? daysAgo(ageDays - 3)
          : null,
        createdAt,
      ],
    );
  }

  await qr.query(
    `INSERT INTO audit_logs ("referralId","actorId",action,"beforeState","afterState","createdAt")
     VALUES ($1,$2,'STATUS_CHANGED',$3::jsonb,$4::jsonb,$5)`,
    [
      referralId,
      providerId,
      JSON.stringify({ status: null }),
      JSON.stringify({ status: ReferralStatus.INTAKE }),
      createdAt,
    ],
  );
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------
async function seed(): Promise<void> {
  await ds.initialize();
  console.log("✅ Connected to database");

  const qr = ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // ── 1. Clear ─────────────────────────────────────────────────────────────
    await qr.query(`
      TRUNCATE
        audit_logs, authorization_requests, referral_notes,
        referral_documents, referral_steps, referrals, patients,
        specialist_insurance_plans, specialist_profiles,
        users, insurance_plans
      RESTART IDENTITY CASCADE
    `);
    console.log("🗑️  Cleared existing data");

    const hash = await bcrypt.hash("password123", 10);

    // ── 2. Insurance plans ────────────────────────────────────────────────────
    const planRows: { id: string; planName: string }[] = await qr.query(
      `INSERT INTO insurance_plans ("payerId","planName","planType","preAuthRequiredFor","isActive")
       SELECT t."payerId", t."planName", t."planType", t."preAuthRequiredFor", true
       FROM jsonb_to_recordset($1::jsonb) AS t(
         "payerId" text, "planName" text, "planType" text, "preAuthRequiredFor" text
       )
       RETURNING id, "planName"`,
      [JSON.stringify(INSURANCE_PLAN_DATA)],
    );
    const planIdByName = new Map(planRows.map((r) => [r.planName, r.id]));
    console.log(`🏦 Created ${planRows.length} insurance plans`);

    // ── 3. Users ──────────────────────────────────────────────────────────────
    const userInserts = [
      ...PHYSICIANS,
      // Strip specialist-only fields before inserting into users table
      ...SPECIALISTS.map(
        ({
          specialtyType: _a,
          zipCode: _b,
          spokenLanguages: _c,
          nextAvailableSlotDays: _d,
          isAcceptingReferrals: _e,
          acceptedPlanNames: _f,
          ...u
        }) => u,
      ),
      ADMIN,
    ].map((u) => ({ ...u, passwordHash: hash }));

    const userRows: { id: string; email: string; role: string }[] =
      await qr.query(
        `INSERT INTO users ("email","passwordHash","fullName","role")
       SELECT email, "passwordHash", "fullName", role::${E.userRole}
       FROM jsonb_to_recordset($1::jsonb) AS t(
         email text, "passwordHash" text, "fullName" text, role text
       )
       RETURNING id, email, role`,
        [JSON.stringify(userInserts)],
      );

    const physicians = userRows.filter((u) =>
      ["PHYSICIAN", "NURSE_PRACTITIONER"].includes(u.role),
    );
    const userIdByEmail = new Map(userRows.map((u) => [u.email, u.id]));
    console.log(`👤 Created ${userRows.length} users`);

    // ── 4. Specialist profiles ────────────────────────────────────────────────
    const profileInserts = SPECIALISTS.map((s) => ({
      userId: userIdByEmail.get(s.email)!,
      specialtyType: s.specialtyType,
      isAcceptingReferrals: s.isAcceptingReferrals,
      zipCode: s.zipCode,
      spokenLanguages: toSimpleArray(s.spokenLanguages), // plain text, not PG array
      nextAvailableSlotDays: s.nextAvailableSlotDays,
    }));

    const profileRows: { id: string; userId: string }[] = await qr.query(
      `INSERT INTO specialist_profiles
         ("userId","specialtyType","isAcceptingReferrals","zipCode","spokenLanguages","nextAvailableSlotDays")
       SELECT
         t."userId"::uuid,
         t."specialtyType"::${E.spSpecialty},
         t."isAcceptingReferrals"::boolean,
         t."zipCode",
         t."spokenLanguages",
         t."nextAvailableSlotDays"::int
       FROM jsonb_to_recordset($1::jsonb) AS t(
         "userId" text, "specialtyType" text, "isAcceptingReferrals" boolean,
         "zipCode" text, "spokenLanguages" text, "nextAvailableSlotDays" int
       )
       RETURNING id, "userId"`,
      [JSON.stringify(profileInserts)],
    );
    const profileIdByUserId = new Map(profileRows.map((p) => [p.userId, p.id]));
    console.log(`🩺 Created ${profileRows.length} specialist profiles`);

    // ── 5. Specialist ↔ insurance plan join rows ──────────────────────────────
    // Column names come directly from the migration DDL:
    //   "specialistProfilesId" and "insurancePlansId"
    // (TypeORM pluralises the relation property name for the join table columns)
    const joinRows: {
      specialistProfilesId: string;
      insurancePlansId: string;
    }[] = [];

    for (const s of SPECIALISTS) {
      const profileId = profileIdByUserId.get(userIdByEmail.get(s.email)!)!;
      for (const planName of s.acceptedPlanNames) {
        const planId = planIdByName.get(planName);
        if (planId)
          joinRows.push({
            specialistProfilesId: profileId,
            insurancePlansId: planId,
          });
      }
    }

    if (joinRows.length) {
      await qr.query(
        `INSERT INTO specialist_insurance_plans ("specialistProfilesId","insurancePlansId")
         SELECT t."specialistProfilesId"::uuid, t."insurancePlansId"::uuid
         FROM jsonb_to_recordset($1::jsonb) AS t("specialistProfilesId" text, "insurancePlansId" text)
         ON CONFLICT DO NOTHING`,
        [JSON.stringify(joinRows)],
      );
    }
    console.log(`🔗 Created ${joinRows.length} specialist–plan links`);

    // ── 6. Patients — insurancePlanId FK (no more free-text insurancePlan) ────
    const patientInserts = PATIENT_DATA.map((p) => ({
      mrn: p.mrn,
      fullName: p.fullName,
      dateOfBirth: p.dateOfBirth,
      insurancePlanId: planIdByName.get(p.insurancePlanName) ?? null,
      insuranceMemberId: p.insuranceMemberId,
      phone: p.phone,
      email: p.email,
    }));

    const patientRows: { id: string }[] = await qr.query(
      `INSERT INTO patients (mrn,"fullName","dateOfBirth","insurancePlanId","insuranceMemberId",phone,email)
       SELECT mrn,"fullName","dateOfBirth"::date,"insurancePlanId"::uuid,"insuranceMemberId",phone,email
       FROM jsonb_to_recordset($1::jsonb) AS t(
         mrn text, "fullName" text, "dateOfBirth" text,
         "insurancePlanId" text, "insuranceMemberId" text, phone text, email text
       )
       RETURNING id`,
      [JSON.stringify(patientInserts)],
    );
    const patientIds = patientRows.map((p) => p.id);
    console.log(`🏥 Created ${patientIds.length} patients`);

    // ── 7. Specialty → specialist user ID lookup ──────────────────────────────
    const specialistsByType = new Map<SpecialtyType, string[]>();
    for (const s of SPECIALISTS) {
      const uid = userIdByEmail.get(s.email)!;
      specialistsByType.set(s.specialtyType, [
        ...(specialistsByType.get(s.specialtyType) ?? []),
        uid,
      ]);
    }
    const pickSpecialist = (type: SpecialtyType): string | null => {
      const matches = specialistsByType.get(type);
      return matches?.length ? pick(matches) : null;
    };

    // ── 8. Referrals ─────────────────────────────────────────────────────────
    let referralCount = 0;

    for (const scenario of REFERRAL_SCENARIOS) {
      await insertReferral(qr, {
        patientId: pick(patientIds),
        providerId: pick(physicians).id,
        specialistId: pickSpecialist(scenario.specialtyType),
        scenario,
        createdAt: daysAgo(Math.floor(Math.random() * 90) + 1),
      });
      referralCount++;
    }

    // Extra rounds to reach 50+
    for (let r = 0; r < 2; r++) {
      for (const scenario of REFERRAL_SCENARIOS.slice(0, 15)) {
        await insertReferral(qr, {
          patientId: pick(patientIds),
          providerId: pick(physicians).id,
          specialistId: pickSpecialist(scenario.specialtyType),
          scenario,
          createdAt: daysAgo(Math.floor(Math.random() * 60) + 1),
        });
        referralCount++;
      }
    }

    await qr.commitTransaction();
    console.log(`✅ Seed complete — ${referralCount} referrals inserted`);
  } catch (err) {
    await qr.rollbackTransaction();
    console.error("❌ Seed failed:", err);
    throw err;
  } finally {
    await qr.release();
    await ds.destroy();
  }
}

seed().catch(() => process.exit(1));
