import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import {
  ReferralStatus,
  ReferralPriority,
  SpecialtyType,
} from "@referrals/shared";
import { Patient } from "../../patients/entities/patient.entity";
import { User } from "../../users/entities/user.entity";
import { ReferralStep } from "./referral-step.entity";
import { ReferralDocument } from "./referral-document.entity";
import { ReferralNote } from "./referral-note.entity";
import { AuthorizationRequest } from "./authorization-request.entity";
import { AuditLog } from "../../audit/entities/audit-log.entity";

@Entity("referrals")
@Index(["status", "priority"])
@Index(["createdAt"])
export class Referral {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  patientId: string;

  @ManyToOne(() => Patient, (patient) => patient.referrals, { eager: false })
  @JoinColumn({ name: "patientId" })
  patient: Patient;

  @Column()
  referringProviderId: string;

  @ManyToOne(() => User, (user) => user.referralsAsReferringProvider, {
    eager: false,
  })
  @JoinColumn({ name: "referringProviderId" })
  referringProvider: User;

  @Column({ type: "varchar", nullable: true })
  specialistId: string | null;

  @ManyToOne(() => User, (user) => user.referralsAsSpecialist, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: "specialistId" })
  specialist: User | null;

  @Index()
  @Column({
    type: "enum",
    enum: ReferralStatus,
    default: ReferralStatus.INTAKE,
  })
  status: ReferralStatus;

  @Column({
    type: "enum",
    enum: ReferralPriority,
    default: ReferralPriority.ROUTINE,
  })
  priority: ReferralPriority;

  @Index()
  @Column({ type: "enum", enum: SpecialtyType })
  specialtyType: SpecialtyType;

  @Column({ type: "text" })
  clinicalReason: string;

  /**
   * ICD-10 codes stored as a comma-separated string.
   */
  @Column({ type: "text" })
  icd10Codes: string;

  @Column({ type: "varchar", nullable: true })
  requestedTimeframe: string | null;

  @Column({ type: "date", nullable: true })
  appointmentDate: Date | null;

  @Column({ type: "varchar", nullable: true })
  appointmentLocation: string | null;

  @Column({ type: "date", nullable: true })
  submittedAt: Date | null;

  @Column({ type: "date", nullable: true })
  closedAt: Date | null;

  @Column({ type: "text", nullable: true })
  specialistReport: string | null;

  @OneToMany(() => ReferralStep, (step) => step.referral, { cascade: true })
  steps: ReferralStep[];

  @OneToMany(() => ReferralDocument, (doc) => doc.referral, { cascade: true })
  documents: ReferralDocument[];

  @OneToMany(() => ReferralNote, (note) => note.referral, { cascade: true })
  notes: ReferralNote[];

  @OneToMany(() => AuthorizationRequest, (auth) => auth.referral, {
    cascade: true,
  })
  authorizationRequests: AuthorizationRequest[];

  @OneToMany(() => AuditLog, (log) => log.referral)
  auditLogs: AuditLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
