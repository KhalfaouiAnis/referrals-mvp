import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("insurance_plans")
export class InsurancePlan {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column() payerId: string; // e.g. "BCBS-IL", "AETNA-PPO"
  @Column() planName: string; // e.g. "Blue Choice PPO"
  @Column() planType: string; // HMO | PPO | EPO | HDHP

  // Which specialty types require pre-auth under this plan
  // e.g. ["CARDIOLOGY", "NEUROLOGY"]
  @Column("simple-array", { nullable: true })
  preAuthRequiredFor: string[];

  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
}
