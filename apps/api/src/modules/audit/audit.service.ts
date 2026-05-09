import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./entities/audit-log.entity";

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async findByReferral(referralId: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { referralId },
      relations: ["actor"],
      order: { createdAt: "DESC" },
    });
  }

  async log(params: {
    referralId: string;
    actorId: string;
    action: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    reason?: string;
  }): Promise<void> {
    await this.auditRepo.save(
      this.auditRepo.create({
        referralId: params.referralId,
        actorId: params.actorId,
        action: params.action,
        beforeState: params.before ?? null,
        afterState: params.after ?? null,
        reason: params.reason ?? null,
      }),
    );
  }
}
