import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Referral } from "../referrals/entities/referral.entity";
import { AuthorizationRequest } from "../referrals/entities/authorization-request.entity";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(AuthorizationRequest)
    private readonly authRepo: Repository<AuthorizationRequest>,
  ) {}

  async getDashboard() {
    const [
      totalReferrals,
      byStatus,
      bySpecialty,
      completionMetrics,
      authRates,
      timeToSchedule,
    ] = await Promise.all([
      this.getTotalReferrals(),
      this.getByStatus(),
      this.getBySpecialty(),
      this.getCompletionMetrics(),
      this.getAuthApprovalRate(),
      this.getTimeToScheduleTrend(),
    ]);

    return {
      stats: {
        totalReferrals,
        avgDaysToCompletion: completionMetrics.avgDays,
        completionRate: completionMetrics.rate,
        pendingAuthorizations: authRates.pending,
        openReferrals: completionMetrics.open,
      },
      byStatus,
      bySpecialty,
      timeToSchedule,
      authApprovalRate: authRates,
    };
  }

  private async getTotalReferrals(): Promise<number> {
    return this.referralRepo.count();
  }

  private async getByStatus() {
    const rows = await this.referralRepo
      .createQueryBuilder("r")
      .select("r.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("r.status")
      .getRawMany<{ status: string; count: string }>();
    return rows.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));
  }

  private async getBySpecialty() {
    const rows = await this.referralRepo
      .createQueryBuilder("r")
      .select('r."specialtyType"', "specialty")
      .addSelect("COUNT(*)", "count")
      .groupBy('r."specialtyType"')
      .getRawMany<{ specialty: string; count: string }>();
    return rows.map((r) => ({
      specialty: r.specialty,
      count: parseInt(r.count, 10),
    }));
  }

  private async getCompletionMetrics() {
    const total = await this.referralRepo.count();
    const closed = await this.referralRepo.count({
      where: { status: "CLOSED" as never },
    });

    const avgResult = await this.referralRepo
      .createQueryBuilder("r")
      .select(
        `AVG(EXTRACT(EPOCH FROM (r."closedAt" - r."createdAt")) / 86400)`,
        "avgDays",
      )
      .where('r."closedAt" IS NOT NULL')
      .getRawOne<{ avgDays: string | null }>();

    return {
      avgDays: avgResult?.avgDays ? parseFloat(avgResult.avgDays) : 0,
      rate: total > 0 ? Math.round((closed / total) * 100) : 0,
      open: total - closed,
    };
  }

  private async getAuthApprovalRate() {
    const rows = await this.authRepo
      .createQueryBuilder("a")
      .select("a.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("a.status")
      .getRawMany<{ status: string; count: string }>();

    const map = Object.fromEntries(
      rows.map((r) => [r.status, parseInt(r.count, 10)]),
    );

    return {
      approved: map["APPROVED"] ?? 0,
      denied: map["DENIED"] ?? 0,
      approvedWithMods: map["APPROVED_WITH_MODIFICATIONS"] ?? 0,
      pending: map["PENDING"] ?? 0,
    };
  }

  private async getTimeToScheduleTrend() {
    // Weekly avg days from created → scheduling for the last 12 weeks
    const rows = await this.referralRepo
      .createQueryBuilder("r")
      .select(`DATE_TRUNC('week', r."createdAt")`, "week")
      .addSelect(
        `AVG(EXTRACT(EPOCH FROM (r."updatedAt" - r."createdAt")) / 86400)`,
        "avgDays",
      )
      .where(`r."createdAt" >= NOW() - INTERVAL '12 weeks'`)
      .andWhere(`r.status IN ('SCHEDULING','CLOSED')`)
      .groupBy(`DATE_TRUNC('week', r."createdAt")`)
      .orderBy("week", "ASC")
      .getRawMany<{ week: string; avgDays: string }>();

    return rows.map((r) => ({
      week: new Date(r.week).toISOString().slice(0, 10),
      avgDays: parseFloat(parseFloat(r.avgDays ?? "0").toFixed(1)),
    }));
  }
}
