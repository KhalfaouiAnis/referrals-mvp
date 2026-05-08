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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

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

const SPECIALISTS = [
  {
    fullName: "Dr. James Hartley",
    email: "j.hartley@cardiology.com",
    role: UserRole.SPECIALIST,
  },
  {
    fullName: "Dr. Elena Rossi",
    email: "e.rossi@dermatology.com",
    role: UserRole.SPECIALIST,
  },
  {
    fullName: "Dr. David Kim",
    email: "d.kim@ortho.com",
    role: UserRole.SPECIALIST,
  },
  {
    fullName: "Dr. Amara Osei",
    email: "a.osei@neuro.com",
    role: UserRole.SPECIALIST,
  },
  {
    fullName: "Dr. Yuki Tanaka",
    email: "y.tanaka@radiology.com",
    role: UserRole.SPECIALIST,
  },
];

const ADMIN = {
  fullName: "Admin Staff",
  email: "admin@clinic.com",
  role: UserRole.ADMIN_STAFF,
};

const PATIENT_DATA = [
  {
    mrn: "MRN-001",
    fullName: "Alice Thompson",
    dateOfBirth: "1988-03-15",
    insurancePlan: "BlueCross PPO",
    insuranceMemberId: "BCX-4421",
    phone: "555-0101",
    email: "alice.t@email.com",
  },
  {
    mrn: "MRN-002",
    fullName: "Robert Martinez",
    dateOfBirth: "1972-11-22",
    insurancePlan: "Medicare Advantage",
    insuranceMemberId: "MCR-7732",
    phone: "555-0102",
    email: "rmartinez@email.com",
  },
  {
    mrn: "MRN-003",
    fullName: "Patricia Johnson",
    dateOfBirth: "1975-07-08",
    insurancePlan: "Aetna HMO",
    insuranceMemberId: "AET-9912",
    phone: "555-0103",
    email: "pjohnson@email.com",
  },
  {
    mrn: "MRN-004",
    fullName: "Michael Davis",
    dateOfBirth: "1988-01-30",
    insurancePlan: "United PPO",
    insuranceMemberId: "UHC-2240",
    phone: "555-0104",
    email: "mdavis@email.com",
  },
  {
    mrn: "MRN-005",
    fullName: "Linda Wilson",
    dateOfBirth: "1963-09-14",
    insurancePlan: "Cigna HMO",
    insuranceMemberId: "CGN-5531",
    phone: "555-0105",
    email: "lwilson@email.com",
  },
  {
    mrn: "MRN-006",
    fullName: "James Anderson",
    dateOfBirth: "1945-05-20",
    insurancePlan: "Medicare",
    insuranceMemberId: "MCR-0012",
    phone: "555-0106",
    email: "j.anderson@email.com",
  },
  {
    mrn: "MRN-007",
    fullName: "Barbara Taylor",
    dateOfBirth: "1970-12-03",
    insurancePlan: "BlueCross PPO",
    insuranceMemberId: "BCX-6678",
    phone: "555-0107",
    email: "btaylor@email.com",
  },
  {
    mrn: "MRN-008",
    fullName: "William Jackson",
    dateOfBirth: "1980-04-17",
    insurancePlan: "Aetna PPO",
    insuranceMemberId: "AET-3348",
    phone: "555-0108",
    email: "wjackson@email.com",
  },
  {
    mrn: "MRN-009",
    fullName: "Elizabeth White",
    dateOfBirth: "1957-08-29",
    insurancePlan: "Humana Gold",
    insuranceMemberId: "HMN-8821",
    phone: "555-0109",
    email: "ewhite@email.com",
  },
  {
    mrn: "MRN-010",
    fullName: "David Harris",
    dateOfBirth: "1992-02-11",
    insurancePlan: "United PPO",
    insuranceMemberId: "UHC-4409",
    phone: "555-0110",
    email: "dharris@email.com",
  },
];

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
      "Poorly controlled Type 2 diabetes (A1C 10.2%). Multiple oral medications failed. Requires insulin initiation and diabetes education program.",
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
      "Symmetric polyarthritis with morning stiffness >1 hour. RF and Anti-CCP positive. Clinical diagnosis rheumatoid arthritis, needs DMARD therapy.",
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
      "Palpitations with documented SVT on Holter monitor. Symptomatic despite beta-blocker. Electrophysiology consultation for ablation consideration.",
    icd10Codes: "I47.1, R00.2",
    status: ReferralStatus.INTAKE,
    priority: ReferralPriority.ROUTINE,
  },
  {
    specialtyType: SpecialtyType.ONCOLOGY,
    clinicalReason:
      "Newly diagnosed breast cancer (ER+/PR+/HER2-). Lumpectomy completed. Requires oncology consultation for adjuvant chemotherapy and radiation planning.",
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

async function seed(): Promise<void> {
  await ds.initialize();
  console.log("✅ Connected to database");

  const queryRunner = ds.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  type User = {
    id: string;
    email: string;
    role: string;
  };

  try {
    // Clear existing data
    await queryRunner.query(
      `TRUNCATE audit_logs, authorization_requests, referral_notes, referral_documents, referral_steps, referrals, patients, users RESTART IDENTITY CASCADE`,
    );
    console.log("🗑️  Cleared existing data");

    const hash = await bcrypt.hash("password123", 10);

    // Users
    const userInserts = [...PHYSICIANS, ...SPECIALISTS, ADMIN].map((u) => ({
      ...u,
      passwordHash: hash,
    }));

    const userResult: User[] = await queryRunner.query(
      `INSERT INTO users ("email", "passwordHash", "fullName", "role")
       SELECT email, "passwordHash", "fullName", role::user_role_enum
       FROM jsonb_to_recordset($1::jsonb) AS t(email text, "passwordHash" text, "fullName" text, role text)
       RETURNING id, email, role`,
      [JSON.stringify(userInserts)],
    );

    const physicians = userResult.filter((u: { role: string }) =>
      ["PHYSICIAN", "NURSE_PRACTITIONER"].includes(u.role),
    );
    
    const specialists = userResult.filter(
      (u: { role: string }) => u.role === "SPECIALIST",
    );
    console.log(`👤 Created ${userResult.length} users`);

    // Patients
    const patientResult = await queryRunner.query(
      `INSERT INTO patients (mrn, "fullName", "dateOfBirth", "insurancePlan", "insuranceMemberId", phone, email)
       SELECT mrn, "fullName", "dateOfBirth"::date, "insurancePlan", "insuranceMemberId", phone, email
       FROM jsonb_to_recordset($1::jsonb) AS t(mrn text, "fullName" text, "dateOfBirth" text, "insurancePlan" text, "insuranceMemberId" text, phone text, email text)
       RETURNING id`,
      [JSON.stringify(PATIENT_DATA)],
    );
    const patientIds: string[] = patientResult.map((p: { id: string }) => p.id);
    console.log(`🏥 Created ${patientIds.length} patients`);

    // Referrals
    let referralCount = 0;
    for (const scenario of REFERRAL_SCENARIOS) {
      const patientId = pick(patientIds);
      const provider = pick(physicians);
      const specialist = pick(specialists);
      const daysOld = Math.floor(Math.random() * 90) + 1;
      const createdAt = daysAgo(daysOld);

      const submittedAt = [
        ReferralStatus.SUBMITTED,
        ReferralStatus.SCHEDULING,
        ReferralStatus.CLOSED,
      ].includes(scenario.status)
        ? daysAgo(daysOld - 3)
        : null;

      const closedAt =
        scenario.status === ReferralStatus.CLOSED
          ? daysAgo(Math.floor(daysOld / 2))
          : null;

      const [referral] = await queryRunner.query(
        `INSERT INTO referrals
           ("patientId", "referringProviderId", "specialistId", status, priority,
            "specialtyType", "clinicalReason", "icd10Codes", "submittedAt", "closedAt",
            "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4::referral_status_enum,$5::referral_priority_enum,
                 $6::specialty_type_enum,$7,$8,$9,$10,$11,$11)
         RETURNING id`,
        [
          patientId,
          provider.id,
          specialist.id,
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

      const referralId = referral.id;

      // Steps
      const stepStatuses = deriveStepStatuses(scenario.status);
      for (const [idx, stepStatus] of stepStatuses.entries()) {
        await queryRunner.query(
          `INSERT INTO referral_steps ("referralId", "stepNumber", "stepCode", label, status, "completedAt", "createdAt")
           VALUES ($1, $2, $3, $4, $5::step_status_enum, $6, $7)`,
          [
            referralId,
            idx + 1,
            `${idx + 1}a`,
            STEP_LABELS[idx],
            stepStatus,
            stepStatus === "COMPLETE" ? daysAgo(daysOld - idx * 2) : null,
            createdAt,
          ],
        );
      }

      // Authorization
      if (
        scenario.authStatus &&
        scenario.authStatus !== AuthorizationStatus.NOT_REQUIRED
      ) {
        await queryRunner.query(
          `INSERT INTO authorization_requests ("referralId", status, "authNumber", "denialReason", "submittedAt", "resolvedAt", "createdAt", "updatedAt")
           VALUES ($1, $2::auth_status_enum, $3, $4, $5, $6, $7, $7)`,
          [
            referralId,
            scenario.authStatus,
            scenario.authStatus === AuthorizationStatus.APPROVED
              ? `AUTH-${Math.floor(Math.random() * 900000 + 100000)}`
              : null,
            scenario.authStatus === AuthorizationStatus.DENIED
              ? "Service not medically necessary per plan guidelines."
              : null,
            daysAgo(daysOld - 5),
            scenario.authStatus !== AuthorizationStatus.PENDING
              ? daysAgo(daysOld - 3)
              : null,
            createdAt,
          ],
        );
      }

      // Audit log — status creation entry
      await queryRunner.query(
        `INSERT INTO audit_logs ("referralId", "actorId", action, "beforeState", "afterState", "createdAt")
         VALUES ($1, $2, 'STATUS_CHANGED', $3::jsonb, $4::jsonb, $5)`,
        [
          referralId,
          provider.id,
          JSON.stringify({ status: null }),
          JSON.stringify({ status: ReferralStatus.INTAKE }),
          createdAt,
        ],
      );

      referralCount++;
    }

    // Repeat scenarios to reach 50+ referrals
    console.log(`📋 Created ${referralCount} referrals (base set)`);

    // Duplicate with slight variations to reach 50+
    const extraRounds = 2;
    for (let r = 0; r < extraRounds; r++) {
      for (const scenario of REFERRAL_SCENARIOS.slice(0, 15)) {
        const patientId = pick(patientIds);
        const provider = pick(physicians);
        const specialist = pick(specialists);
        const daysOld = Math.floor(Math.random() * 60) + 1;
        const createdAt = daysAgo(daysOld);

        const [referral] = await queryRunner.query(
          `INSERT INTO referrals
             ("patientId", "referringProviderId", "specialistId", status, priority,
              "specialtyType", "clinicalReason", "icd10Codes", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4::referral_status_enum,$5::referral_priority_enum,
                   $6::specialty_type_enum,$7,$8,$9,$9)
           RETURNING id`,
          [
            patientId,
            provider.id,
            specialist.id,
            scenario.status,
            scenario.priority,
            scenario.specialtyType,
            scenario.clinicalReason,
            scenario.icd10Codes,
            createdAt,
          ],
        );

        const stepStatuses = deriveStepStatuses(scenario.status);
        for (const [idx, stepStatus] of stepStatuses.entries()) {
          await queryRunner.query(
            `INSERT INTO referral_steps ("referralId", "stepNumber", "stepCode", label, status, "createdAt")
             VALUES ($1,$2,$3,$4,$5::step_status_enum,$6)`,
            [
              referral.id,
              idx + 1,
              `${idx + 1}a`,
              STEP_LABELS[idx],
              stepStatus,
              createdAt,
            ],
          );
        }

        await queryRunner.query(
          `INSERT INTO audit_logs ("referralId", "actorId", action, "beforeState", "afterState", "createdAt")
           VALUES ($1,$2,'STATUS_CHANGED',$3::jsonb,$4::jsonb,$5)`,
          [
            referral.id,
            provider.id,
            JSON.stringify({ status: null }),
            JSON.stringify({ status: ReferralStatus.INTAKE }),
            createdAt,
          ],
        );

        referralCount++;
      }
    }

    await queryRunner.commitTransaction();
    console.log(`✅ Seed complete. Total referrals: ${referralCount}`);
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error("❌ Seed failed:", err);
    throw err;
  } finally {
    await queryRunner.release();
    await ds.destroy();
  }
}

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

  const idx = order.indexOf(status);
  const currentIdx = idx < 0 ? 0 : idx;

  return order.map((_, i) => {
    if (i < currentIdx) return "COMPLETE";
    if (i === currentIdx) return "IN_PROGRESS";
    return "PENDING";
  });
}

seed().catch(() => process.exit(1));