import { IsString, IsEnum, IsOptional, IsNumber, Min, IsDateString } from 'class-validator';
import { FinancePreference, LeadStatus, LeadClosureReason } from '@prisma/client';

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  alternateMobile?: string;

  @IsOptional()
  @IsString()
  discom?: string;

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsOptional()
  @IsString()
  leadSource?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedCapacityKw?: number;

  @IsOptional()
  @IsEnum(FinancePreference)
  financePreference?: FinancePreference;

  @IsOptional()
  @IsString()
  addressVillage?: string;

  @IsOptional()
  @IsString()
  addressPincode?: string;

  @IsOptional()
  @IsString()
  assignedStaffId?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadClosureReason)
  closureReason?: LeadClosureReason;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
