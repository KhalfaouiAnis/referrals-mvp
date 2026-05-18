import { ReferralPriority } from '../enums/referral-priority.enum';
import { ReferralStatus } from '../enums/referral-status.enum';
import { SpecialtyType } from '../enums/specialty-type.enum';

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
