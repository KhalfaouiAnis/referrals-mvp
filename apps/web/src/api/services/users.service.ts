import { api } from "../client";
import { SpecialtyType } from "@referrals/shared";

export interface SpecialistResult {
  id: string;
  fullName: string;
  specialtyType: string;
  zipCode: string | null;
  isAcceptingReferrals: boolean;
  nextAvailableSlotDays: number | null;
}

export const usersService = {
  listSpecialists: (specialtyType: SpecialtyType): Promise<SpecialistResult[]> =>
    api.get(`/api/v1/users?specialtyType=${specialtyType}`),
};
