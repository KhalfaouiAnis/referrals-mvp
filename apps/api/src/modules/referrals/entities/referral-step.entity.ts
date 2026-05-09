import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Referral } from "./referral.entity";
import { User } from "../../users/entities/user.entity";

export enum StepStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETE = "COMPLETE",
  SKIPPED = "SKIPPED",
}

@Entity("referral_steps")
@Index(["referralId", "stepNumber"], { unique: true })
export class ReferralStep {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  referralId: string;

  @ManyToOne(() => Referral, (referral) => referral.steps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "referralId" })
  referral: Referral;

  /** e.g. 1, 2, 3 … 7 — maps to the 7 workflow stages */
  @Column()
  stepNumber: number;

  /** e.g. "1a", "2c" — substep code for tracking granular progress */
  @Column()
  stepCode: string;

  @Column()
  label: string;

  @Column({ type: "enum", enum: StepStatus, default: StepStatus.PENDING })
  status: StepStatus;

  /** Flexible store for step-specific data (e.g. auth number, denial reason) */
  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: "varchar", nullable: true })
  completedById: string | null;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: "completedById" })
  completedBy: User | null;

  @Column({ type: "date", nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
