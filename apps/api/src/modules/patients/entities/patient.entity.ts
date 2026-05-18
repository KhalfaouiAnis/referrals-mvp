import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Referral } from "../../referrals/entities/referral.entity";
import { InsurancePlan } from "src/modules/users/entities/insurance-plans.entity";

@Entity("patients")
export class Patient {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column()
  mrn: string; // Medical Record Number

  @Index()
  @Column()
  fullName: string;

  @Column({ type: "date" })
  dateOfBirth: string;

  @ManyToOne(() => InsurancePlan, { nullable: true, eager: false })
  @JoinColumn({ name: "insurancePlanId" })
  insurancePlan: InsurancePlan | null;

  @Column({ type: "uuid", nullable: true })
  insurancePlanId: string | null;

  @Column({ type: "varchar", nullable: true })
  insuranceMemberId: string | null;

  @Column({ type: "varchar", nullable: true })
  phone: string | null;

  @Column({ type: "varchar", nullable: true })
  email: string | null;

  @Column({ type: "varchar", nullable: true })
  address: string | null;

  @Column({ type: "varchar", nullable: true })
  city: string | null;

  @Column({ type: "varchar", nullable: true })
  state: string | null;

  @Column({ type: "varchar", nullable: true })
  zip: string | null;

  @OneToMany(() => Referral, (referral) => referral.patient)
  referrals: Referral[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
