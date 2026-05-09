import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Patient } from "./entities/patient.entity";
import { PaginatedResult } from "@referrals/shared";

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async search(query: string, limit = 10): Promise<PaginatedResult<Patient>> {
    const qb = this.patientRepo.createQueryBuilder("p");

    if (query && query.length >= 2) {
      qb.where(`p."fullName" ILIKE :q OR p.mrn ILIKE :q OR p.email ILIKE :q`, {
        q: `%${query}%`,
      });
    }

    const [data, total] = await qb
      .orderBy('p."fullName"', "ASC")
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: { page: 1, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException(`Patient ${id} not found.`);
    return patient;
  }
}
