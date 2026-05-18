import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { SpecialtyType } from "@referrals/shared";
import { InsurancePlan } from "./insurance-plans.entity";

@Entity("specialist_profiles")
export class SpecialistProfile {
  @PrimaryGeneratedColumn("uuid") id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
  @Column() userId: string;

  @Column({ type: "enum", enum: SpecialtyType })
  specialtyType: SpecialtyType;

  @Column({ default: true })
  isAcceptingReferrals: boolean;

  @Column({ nullable: true }) zipCode: string;

  // Refreshed nightly by a cron job
  @Column({ type: "int", nullable: true })
  nextAvailableSlotDays: number;

  @ManyToMany(() => InsurancePlan, { eager: false })
  @JoinTable({ name: "specialist_insurance_plans" })
  acceptedInsurancePlans: InsurancePlan[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
