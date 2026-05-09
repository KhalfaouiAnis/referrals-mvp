import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { UserRole } from "@referrals/shared";

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
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) throw new NotFoundException(`User ${id} not found.`);

    const { passwordHash: _, ...safe } = user;
    return safe as Omit<User, "passwordHash">;
  }

  /** Returns specialist users for autocomplete in referral forms */
  async findSpecialists(): Promise<Omit<User, "passwordHash">[]> {
    return this.findAll(UserRole.SPECIALIST);
  }
}
