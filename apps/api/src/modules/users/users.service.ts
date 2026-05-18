import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { SpecialtyType, UserRole } from "@referrals/shared";
import { SpecialistOptionDto } from "./dto/specialist-option.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(role?: UserRole): Promise<Omit<User, "passwordHash">[]> {
    const qb = this.userRepo
      .createQueryBuilder("u")
      .select([
        "u.id",
        "u.email",
        "u.fullName",
        "u.role",
        "u.isActive",
        "u.createdAt",
      ]);

    if (role) {
      qb.where("u.role = :role", { role });
    }

    return qb.getMany() as Promise<Omit<User, "passwordHash">[]>;
  }

  async findOne(id: string): Promise<Omit<User, "passwordHash">> {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) throw new NotFoundException(`User ${id} not found.`);

    const { passwordHash: _, ...safe } = user;
    return safe as Omit<User, "passwordHash">;
  }

  /** Returns specialist users for autocomplete in referral forms */
  // async findSpecialists(): Promise<Omit<User, "passwordHash">[]> {
  //   return this.findAll(UserRole.SPECIALIST);
  // }

  async findSpecialists(
    specialtyType?: SpecialtyType,
  ): Promise<SpecialistOptionDto[]> {
    const qb = this.userRepo
      .createQueryBuilder("u")
      // specialist_profiles has a unique userId FK (OneToOne)
      .innerJoinAndSelect("u.specialistProfile", "sp")
      .where("u.role = :role", { role: "SPECIALIST" })
      .andWhere("u.isActive = true")
      .andWhere("sp.isAcceptingReferrals = true");

    if (specialtyType) {
      qb.andWhere("sp.specialtyType = :specialtyType", {
        specialtyType,
      });
    }

    qb.orderBy("sp.nextAvailableSlotDays", "ASC", "NULLS LAST").addOrderBy(
      "u.fullName",
      "ASC",
    );

    const users = await qb.getMany();

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      specialtyType: u?.specialistProfile?.specialtyType || "",
      isAcceptingReferrals: u?.specialistProfile?.isAcceptingReferrals || true,
      nextAvailableSlotDays:
        u?.specialistProfile?.nextAvailableSlotDays ?? null,
      zipCode: u?.specialistProfile?.zipCode ?? null,
    }));
  }
}
