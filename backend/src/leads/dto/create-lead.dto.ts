import { IsString, IsEnum, IsOptional, Length, IsNumber, Min } from 'class-validator';
import { Discom, ProjectType, LeadSource, FinancePreference } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  customerName: string;

  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  alternateMobile?: string;

  @IsEnum(Discom)
  discom: Discom;

  @IsEnum(ProjectType)
  projectType: ProjectType;

  @IsEnum(LeadSource)
  leadSource: LeadSource;

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedCapacityKw?: number;

  @IsOptional()
  @IsEnum(FinancePreference)
  financePreference?: FinancePreference;

  @IsString()
  addressVillage: string;

  @IsOptional()
  @IsString()
  addressHouse?: string;

  @IsOptional()
  @IsString()
  addressStreet?: string;

  @IsOptional()
  @Length(6, 6)
  addressPincode?: string;

  @IsOptional()
  @IsString()
  addressDistrictId?: string;

  @IsOptional()
  @IsString()
  addressStateId?: string;

  @IsString()
  assignedStaffId: string;

  @IsOptional()
  @IsString()
  followUpDate?: string;
}
