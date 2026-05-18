import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { Referral } from "./entities/referral.entity";
import { ReferralNote } from "./entities/referral-note.entity";
import { User } from "../users/entities/user.entity";
import {
  AddNoteDto,
  BulkActionDto,
  CreateReferralDto,
  ReferralFilterDto,
  UpdateReferralDto,
} from "./dto/referral.dto";
import { ReferralWorkflowService } from "./referral-workflow.service";
import { PaginatedResult, ReferralPriority } from "@referrals/shared";
import { AuditService } from "../audit/audit.service";
import { Patient } from "../patients/entities/patient.entity";
import { SpecialistMatchingService } from "./specialist-matching.service";

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,

    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,

    @InjectRepository(ReferralNote)
    private readonly noteRepo: Repository<ReferralNote>,

    private readonly workflowService: ReferralWorkflowService,
    private readonly specialistMatchingService: SpecialistMatchingService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateReferralDto, actor: User): Promise<Referral> {
    // Auto-routing when no specialist is chosen by the creator
    let resolvedSpecialistId = dto.specialistId ?? null;
    let autoAssigned = false;
    let matchReasons: string[] = [];

    if (!resolvedSpecialistId) {
      // Load patient with insurancePlanId so the matcher can check in-network status
      const patient = await this.patientRepo.findOneOrFail({
        where: { id: dto.patientId },
      });

      const match = await this.specialistMatchingService.findBestMatch(
        patient,
        dto.specialtyType,
      );

      if (match) {
        resolvedSpecialistId = match.specialistUserId;
        autoAssigned = true;
        matchReasons = match.reasons;
      }
      // No match → referral saved with specialistId = null;
      // a BullMQ job notifies staff to assign manually.
    }

    const referral = this.referralRepo.create({
      ...dto,
      referringProviderId: actor.id,
      specialistId: resolvedSpecialistId,
      // autoAssigned,
      // autoAssignedAt:      autoAssigned ? new Date() : null,
    });
    const saved = await this.referralRepo.save(referral);

    // Initialise the 7 step rows
    await this.workflowService.initializeSteps(saved.id);

    // Audit entry
    await this.auditService.log({
      referralId: saved.id,
      actorId: actor.id,
      action: "REFERRAL_CREATED",
      after: {
        status: saved.status,
        specialtyType: saved.specialtyType,
        specialistId: resolvedSpecialistId,
      },
    });

    // TODO
    // if (!dto.specialistId) {
    //   await this.referralQueue.add("MANUAL_SPECIALIST_ASSIGNMENT_NEEDED", {
    //     referralId: saved.id,
    //     specialtyType: dto.specialtyType,
    //   });
    // }

    return this.findOne(saved.id);
  }

  // List (server-side filtered, sorted, paginated)
  async findAll(
    filters: ReferralFilterDto,
  ): Promise<PaginatedResult<Referral>> {
    const qb = this.buildListQuery(filters);

    const allowedSortFields: Record<string, string> = {
      createdAt: "r.createdAt",
      updatedAt: "r.updatedAt",
      status: "r.status",
      priority: "r.priority",
      patientName: "patient.fullName",
      specialtyType: "r.specialtyType",
    };
    const sortField =
      allowedSortFields[filters.sortBy ?? "createdAt"] ?? "r.createdAt";
    const sortOrder = filters.sortOrder ?? "DESC";

    qb.orderBy(sortField, sortOrder);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private buildListQuery(
    filters: ReferralFilterDto,
  ): SelectQueryBuilder<Referral> {
    const qb = this.referralRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.patient", "patient")
      .leftJoinAndSelect("r.referringProvider", "referringProvider")
      .leftJoinAndSelect("r.specialist", "specialist");

    if (filters.search) {
      qb.andWhere(
        `(patient."fullName" ILIKE :q OR patient.mrn ILIKE :q OR r."clinicalReason" ILIKE :q OR r."icd10Codes" ILIKE :q)`,
        { q: `%${filters.search}%` },
      );
    }
    if (filters.status?.length) {
      qb.andWhere("r.status IN (:...status)", { status: filters.status });
    }
    if (filters.priority?.length) {
      qb.andWhere("r.priority IN (:...priority)", {
        priority: filters.priority,
      });
    }
    if (filters.specialtyType?.length) {
      qb.andWhere('r."specialtyType" IN (:...specialtyType)', {
        specialtyType: filters.specialtyType,
      });
    }
    if (filters.dateFrom) {
      qb.andWhere('r."createdAt" >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      qb.andWhere('r."createdAt" <= :dateTo', { dateTo: filters.dateTo });
    }

    return qb;
  }

  // Find one (full detail)
  async findOne(id: string): Promise<Referral> {
    const referral = await this.referralRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.patient", "patient")
      .leftJoinAndSelect("r.referringProvider", "referringProvider")
      .leftJoinAndSelect("r.specialist", "specialist")
      .leftJoinAndSelect("r.steps", "steps")
      .leftJoinAndSelect("steps.completedBy", "stepCompletedBy")
      .leftJoinAndSelect("r.documents", "documents")
      .leftJoinAndSelect("documents.uploadedBy", "docUploadedBy")
      .leftJoinAndSelect("r.notes", "notes")
      .leftJoinAndSelect("notes.author", "noteAuthor")
      .leftJoinAndSelect("r.authorizationRequests", "authorizationRequests")
      .leftJoinAndSelect("r.auditLogs", "auditLogs")
      .leftJoinAndSelect("auditLogs.actor", "auditActor")
      .where("r.id = :id", { id })
      .orderBy("steps.stepNumber", "ASC")
      .addOrderBy("notes.createdAt", "DESC")
      .addOrderBy("auditLogs.createdAt", "DESC")
      .getOne();

    if (!referral) throw new NotFoundException(`Referral ${id} not found.`);
    return referral;
  }

  async update(
    id: string,
    dto: UpdateReferralDto,
    actor: User,
  ): Promise<Referral> {
    const referral = await this.referralRepo.findOneOrFail({ where: { id } });
    const before = {
      priority: referral.priority,
      specialistId: referral.specialistId,
    };

    Object.assign(referral, dto);
    await this.referralRepo.save(referral);

    await this.auditService.log({
      referralId: id,
      actorId: actor.id,
      action: "REFERRAL_UPDATED",
      before,
      after: dto as Record<string, unknown>,
    });

    return this.findOne(id);
  }

  async addNote(
    referralId: string,
    dto: AddNoteDto,
    actor: User,
  ): Promise<ReferralNote> {
    await this.referralRepo.findOneOrFail({ where: { id: referralId } });

    const note = this.noteRepo.create({
      referralId,
      authorId: actor.id,
      body: dto.body,
    });
    await this.noteRepo.save(note);

    await this.auditService.log({
      referralId,
      actorId: actor.id,
      action: "NOTE_ADDED",
      after: { noteId: note.id },
    });

    return this.noteRepo.findOne({
      where: { id: note.id },
      relations: ["author"],
    }) as Promise<ReferralNote>;
  }

  // Bulk actions

  async bulkAction(
    dto: BulkActionDto,
    actor: User,
  ): Promise<{ updated: number }> {
    let updated = 0;

    for (const referralId of dto.referralIds) {
      const referral = await this.referralRepo.findOne({
        where: { id: referralId },
      });
      if (!referral) continue;

      if (dto.action === "SET_PRIORITY") {
        const before = { priority: referral.priority };
        referral.priority = dto.payload.priority as ReferralPriority;
        await this.referralRepo.save(referral);
        await this.auditService.log({
          referralId,
          actorId: actor.id,
          action: "PRIORITY_UPDATED",
          before,
          after: { priority: referral.priority },
        });
        updated++;
      } else if (dto.action === "REASSIGN_SPECIALIST") {
        const before = { specialistId: referral.specialistId };
        referral.specialistId = dto.payload.specialistId as string;
        await this.referralRepo.save(referral);
        await this.auditService.log({
          referralId,
          actorId: actor.id,
          action: "SPECIALIST_ASSIGNED",
          before,
          after: { specialistId: referral.specialistId },
        });
        updated++;
      }
    }

    return { updated };
  }

  async exportCsv(filters: ReferralFilterDto): Promise<string> {
    const qb = this.buildListQuery(filters);
    const rows = await qb.getMany();

    const header = [
      "ID",
      "Patient",
      "MRN",
      "Specialty",
      "Status",
      "Priority",
      "Referring Provider",
      "Specialist",
      "Created At",
    ].join(",");

    const lines = rows.map((r) =>
      [
        r.id,
        `"${r.patient?.fullName ?? ""}"`,
        r.patient?.mrn ?? "",
        r.specialtyType,
        r.status,
        r.priority,
        `"${r.referringProvider?.fullName ?? ""}"`,
        `"${r.specialist?.fullName ?? ""}"`,
        r.createdAt.toISOString(),
      ].join(","),
    );

    return [header, ...lines].join("\n");
  }
}
