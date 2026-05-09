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

@Entity("referral_documents")
export class ReferralDocument {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  referralId: string;

  @ManyToOne(() => Referral, (referral) => referral.documents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "referralId" })
  referral: Referral;

  @Column()
  uploadedById: string;

  @ManyToOne(() => User, (user) => user.uploadedDocuments, { eager: false })
  @JoinColumn({ name: "uploadedById" })
  uploadedBy: User;

  @Column()
  fileName: string;

  /** Storage key (S3 object key) */
  @Column()
  fileKey: string;

  @Column()
  mimeType: string;

  @Column({ type: "int" })
  sizeBytes: number;

  /** Optional human label, e.g. "Latest labs", "Imaging report" */
  @Column({ type: "varchar", nullable: true })
  label: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
