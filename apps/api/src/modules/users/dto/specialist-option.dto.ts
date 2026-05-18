export class SpecialistOptionDto {
  id: string;
  fullName: string;
  specialtyType: string;
  isAcceptingReferrals: boolean;
  nextAvailableSlotDays: number | null;
  zipCode: string | null;
}
