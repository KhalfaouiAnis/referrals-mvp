import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "@referrals/shared";
import { Referral } from "../../referrals/entities/referral.entity";
import { AuditLog } from "../../audit/entities/audit-log.entity";
import { ReferralNote } from "../../referrals/entities/referral-note.entity";
import { ReferralDocument } from "../../referrals/entities/referral-document.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ type: "enum", enum: UserRole })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Referral, (referral) => referral.referringProvider)
  referralsAsReferringProvider: Referral[];

  @OneToMany(() => Referral, (referral) => referral.specialist)
  referralsAsSpecialist: Referral[];

  @OneToMany(() => AuditLog, (log) => log.actor)
  auditLogs: AuditLog[];

  @OneToMany(() => ReferralNote, (note) => note.author)
  notes: ReferralNote[];

  @OneToMany(() => ReferralDocument, (doc) => doc.uploadedBy)
  uploadedDocuments: ReferralDocument[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
