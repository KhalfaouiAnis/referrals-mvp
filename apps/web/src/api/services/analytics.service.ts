import { api } from "../client";

export interface DashboardStats {
  totalReferrals: number;
  avgDaysToCompletion: number;
  completionRate: number;
  pendingAuthorizations: number;
  openReferrals: number;
}

export interface ReferralsByStatus {
  status: string;
  count: number;
}

export interface ReferralsBySpecialty {
  specialty: string;
  count: number;
}

export interface TimeToSchedulePoint {
  week: string;
  avgDays: number;
}

export interface AuthApprovalRate {
  approved: number;
  denied: number;
  approvedWithMods: number;
  pending: number;
}

export interface DashboardData {
  stats: DashboardStats;
  byStatus: ReferralsByStatus[];
  bySpecialty: ReferralsBySpecialty[];
  timeToSchedule: TimeToSchedulePoint[];
  authApprovalRate: AuthApprovalRate;
}

export const analyticsService = {
  getDashboard: (): Promise<DashboardData> =>
    api.get("/api/v1/analytics/dashboard"),
};
