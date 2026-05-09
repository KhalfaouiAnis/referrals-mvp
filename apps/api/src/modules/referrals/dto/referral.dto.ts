import {
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import {
  ReferralPriority,
  ReferralStatus,
  SpecialtyType,
} from "@referrals/shared";
import { PaginationDto } from "../../../common/pagination/pagination.dto";

export class CreateReferralDto {
  @IsUUID()
  patientId: string;

  @IsEnum(SpecialtyType)
  specialtyType: SpecialtyType;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  clinicalReason: string;

  @IsString()
  @MinLength(3)
  icd10Codes: string;

  @IsEnum(ReferralPriority)
  priority: ReferralPriority;

  @IsOptional()
  @IsString()
  requestedTimeframe?: string;

  @IsOptional()
  @IsUUID()
  specialistId?: string;
}

export class UpdateReferralDto {
  @IsOptional()
  @IsEnum(ReferralPriority)
  priority?: ReferralPriority;

  @IsOptional()
  @IsUUID()
  specialistId?: string;

  @IsOptional()
  @IsString()
  appointmentLocation?: string;

  @IsOptional()
  specialistReport?: string;
}

export class AdvanceStepDto {
  @IsEnum(ReferralStatus)
  targetStatus: ReferralStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class AddNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body: string;
}

export class ReferralFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ReferralStatus, { each: true })
  @Type(() => String)
  status?: ReferralStatus[];

  @IsOptional()
  @IsArray()
  @IsEnum(ReferralPriority, { each: true })
  @Type(() => String)
  priority?: ReferralPriority[];

  @IsOptional()
  @IsArray()
  @IsEnum(SpecialtyType, { each: true })
  @Type(() => String)
  specialtyType?: SpecialtyType[];

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";
}

export class BulkActionDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  referralIds: string[];

  @IsIn(["SET_PRIORITY", "REASSIGN_SPECIALIST"])
  action: "SET_PRIORITY" | "REASSIGN_SPECIALIST";

  payload: Record<string, unknown>;
}
