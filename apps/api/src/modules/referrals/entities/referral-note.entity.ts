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

@Entity("referral_notes")
export class ReferralNote {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  referralId: string;

  @ManyToOne(() => Referral, (referral) => referral.notes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "referralId" })
  referral: Referral;

  @Column()
  authorId: string;

  @ManyToOne(() => User, (user) => user.notes, { eager: false })
  @JoinColumn({ name: "authorId" })
  author: User;

  @Column({ type: "text" })
  body: string;

  @CreateDateColumn()
  createdAt: Date;
}
