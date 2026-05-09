import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AuthorizationStatus } from "@referrals/shared";
import { Referral } from "./referral.entity";

@Entity("authorization_requests")
export class AuthorizationRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  referralId: string;

  @ManyToOne(() => Referral, (referral) => referral.authorizationRequests, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "referralId" })
  referral: Referral;

  @Column({
    type: "enum",
    enum: AuthorizationStatus,
    default: AuthorizationStatus.PENDING,
  })
  status: AuthorizationStatus;

  /** Approval number returned by insurer */
  @Column({ type: "varchar", nullable: true })
  authNumber: string | null;

  @Column({ type: "text", nullable: true })
  denialReason: string | null;

  /** Restrictions when approved with modifications (e.g. "max 3 visits") */
  @Column({ type: "text", nullable: true })
  modifications: string | null;

  @Column({ type: "date", nullable: true })
  validFrom: string | null;

  @Column({ type: "date", nullable: true })
  validTo: string | null;

  @Column({ type: "date", nullable: true })
  submittedAt: Date | null;

  @Column({ type: "date", nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
