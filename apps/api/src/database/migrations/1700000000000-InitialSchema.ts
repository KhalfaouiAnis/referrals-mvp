import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── ENUMS ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM (
        'PHYSICIAN', 'NURSE_PRACTITIONER', 'ADMIN_STAFF', 'SPECIALIST', 'SUPER_ADMIN'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "referral_status_enum" AS ENUM (
        'INTAKE', 'CLINICAL_PREP', 'AUTHORIZATION', 'READY_TO_SUBMIT',
        'SUBMITTED', 'SCHEDULING', 'CLOSED', 'CANCELLED', 'AUTH_DENIED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "referral_priority_enum" AS ENUM ('ROUTINE', 'URGENT', 'STAT')
    `);

    await queryRunner.query(`
      CREATE TYPE "specialty_type_enum" AS ENUM (
        'CARDIOLOGY', 'DERMATOLOGY', 'ORTHOPEDICS', 'NEUROLOGY', 'RADIOLOGY',
        'GASTROENTEROLOGY', 'PULMONOLOGY', 'ENDOCRINOLOGY', 'ONCOLOGY', 'RHEUMATOLOGY'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "auth_status_enum" AS ENUM (
        'NOT_REQUIRED', 'PENDING', 'APPROVED', 'APPROVED_WITH_MODIFICATIONS',
        'DENIED', 'APPEALING'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "step_status_enum" AS ENUM (
        'PENDING', 'IN_PROGRESS', 'COMPLETE', 'SKIPPED'
      )
    `);

    // ── USERS ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "email"        VARCHAR NOT NULL UNIQUE,
        "passwordHash" VARCHAR NOT NULL,
        "fullName"     VARCHAR NOT NULL,
        "role"         "user_role_enum" NOT NULL,
        "isActive"     BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // ── PATIENTS ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id"               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "mrn"              VARCHAR NOT NULL UNIQUE,
        "fullName"         VARCHAR NOT NULL,
        "dateOfBirth"      DATE NOT NULL,
        "insurancePlan"    VARCHAR,
        "insuranceMemberId" VARCHAR,
        "phone"            VARCHAR,
        "email"            VARCHAR,
        "address"          VARCHAR,
        "city"             VARCHAR,
        "state"            VARCHAR,
        "zip"              VARCHAR,
        "createdAt"        TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt"        TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_patients_fullName" ON "patients" ("fullName")`);

    // ── REFERRALS ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "referrals" (
        "id"                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "patientId"             UUID NOT NULL REFERENCES "patients"("id"),
        "referringProviderId"   UUID NOT NULL REFERENCES "users"("id"),
        "specialistId"          UUID REFERENCES "users"("id"),
        "status"                "referral_status_enum" NOT NULL DEFAULT 'INTAKE',
        "priority"              "referral_priority_enum" NOT NULL DEFAULT 'ROUTINE',
        "specialtyType"         "specialty_type_enum" NOT NULL,
        "clinicalReason"        TEXT NOT NULL,
        "icd10Codes"            TEXT NOT NULL,
        "requestedTimeframe"    VARCHAR,
        "appointmentDate"       TIMESTAMP,
        "appointmentLocation"   VARCHAR,
        "submittedAt"           TIMESTAMP,
        "closedAt"              TIMESTAMP,
        "specialistReport"      TEXT,
        "createdAt"             TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt"             TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_referrals_patientId"     ON "referrals" ("patientId")`);
    await queryRunner.query(`CREATE INDEX "IDX_referrals_status"        ON "referrals" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_referrals_specialtyType" ON "referrals" ("specialtyType")`);
    await queryRunner.query(`CREATE INDEX "IDX_referrals_status_priority" ON "referrals" ("status", "priority")`);
    await queryRunner.query(`CREATE INDEX "IDX_referrals_createdAt"     ON "referrals" ("createdAt")`);

    // Full-text search on patient name via referral (for list search)
    await queryRunner.query(`
      CREATE INDEX "IDX_referrals_fts_clinical" ON "referrals"
      USING gin(to_tsvector('english', "clinicalReason"))
    `);

    // ── REFERRAL STEPS ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "referral_steps" (
        "id"            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "referralId"    UUID NOT NULL REFERENCES "referrals"("id") ON DELETE CASCADE,
        "stepNumber"    INTEGER NOT NULL,
        "stepCode"      VARCHAR NOT NULL,
        "label"         VARCHAR NOT NULL,
        "status"        "step_status_enum" NOT NULL DEFAULT 'PENDING',
        "metadata"      JSONB,
        "completedById" UUID REFERENCES "users"("id"),
        "completedAt"   TIMESTAMP,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE ("referralId", "stepNumber")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_referral_steps_referralId" ON "referral_steps" ("referralId")`);

    // ── REFERRAL DOCUMENTS ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "referral_documents" (
        "id"           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "referralId"   UUID NOT NULL REFERENCES "referrals"("id") ON DELETE CASCADE,
        "uploadedById" UUID NOT NULL REFERENCES "users"("id"),
        "fileName"     VARCHAR NOT NULL,
        "fileKey"      VARCHAR NOT NULL,
        "mimeType"     VARCHAR NOT NULL,
        "sizeBytes"    INTEGER NOT NULL,
        "label"        VARCHAR,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_referral_docs_referralId" ON "referral_documents" ("referralId")`);

    // ── REFERRAL NOTES ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "referral_notes" (
        "id"         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "referralId" UUID NOT NULL REFERENCES "referrals"("id") ON DELETE CASCADE,
        "authorId"   UUID NOT NULL REFERENCES "users"("id"),
        "body"       TEXT NOT NULL,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_referral_notes_referralId" ON "referral_notes" ("referralId")`);

    // ── AUTHORIZATION REQUESTS ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "authorization_requests" (
        "id"            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "referralId"    UUID NOT NULL REFERENCES "referrals"("id") ON DELETE CASCADE,
        "status"        "auth_status_enum" NOT NULL DEFAULT 'PENDING',
        "authNumber"    VARCHAR,
        "denialReason"  TEXT,
        "modifications" TEXT,
        "validFrom"     DATE,
        "validTo"       DATE,
        "submittedAt"   TIMESTAMP,
        "resolvedAt"    TIMESTAMP,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt"     TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_auth_requests_referralId" ON "authorization_requests" ("referralId")`);

    // ── AUDIT LOGS ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "referralId"  UUID NOT NULL REFERENCES "referrals"("id") ON DELETE CASCADE,
        "actorId"     UUID NOT NULL REFERENCES "users"("id"),
        "action"      VARCHAR NOT NULL,
        "beforeState" JSONB,
        "afterState"  JSONB,
        "reason"      TEXT,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_referralId_createdAt" ON "audit_logs" ("referralId", "createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "authorization_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referral_notes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referral_documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referral_steps"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referrals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "patients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "step_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "auth_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "specialty_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "referral_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "referral_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
