import { ReferralPriority } from '../enums/referral-priority.enum';
import { ReferralStatus } from '../enums/referral-status.enum';
import { SpecialtyType } from '../enums/specialty-type.enum';
import { AuthorizationStatus } from '../enums/auth-status.enum';

export interface ReferralSummary {
  id: string;
  patientName: string;
  referralType: SpecialtyType;
  status: ReferralStatus;
  priority: ReferralPriority;
  specialistName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralFilterParams {
  status?: ReferralStatus[];
  priority?: ReferralPriority[];
  specialtyType?: SpecialtyType[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AuthorizationSummary {
  id: string;
  status: AuthorizationStatus;
  authNumber: string | null;
  denialReason: string | null;
  validFrom: string | null;
  validTo: string | null;
}
