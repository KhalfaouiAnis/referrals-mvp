import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Referral } from "../../referrals/entities/referral.entity";
import { User } from "../../users/entities/user.entity";

@Entity("audit_logs")
@Index(["referralId", "createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  referralId: string;

  @ManyToOne(() => Referral, (referral) => referral.auditLogs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "referralId" })
  referral: Referral;

  @Column()
  actorId: string;

  @ManyToOne(() => User, (user) => user.auditLogs, { eager: false })
  @JoinColumn({ name: "actorId" })
  actor: User;

  /**
   * Describes what changed, e.g.:
   *   STATUS_CHANGED | NOTE_ADDED | DOCUMENT_UPLOADED
   *   PRIORITY_UPDATED | SPECIALIST_ASSIGNED
   */
  @Column()
  action: string;

  @Column({ type: "jsonb", nullable: true })
  beforeState: Record<string, unknown> | null;

  @Column({ type: "jsonb", nullable: true })
  afterState: Record<string, unknown> | null;

  /** Optional free-text reason supplied by the actor */
  @Column({ type: "text", nullable: true })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
