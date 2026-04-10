import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Discom, ProjectType, FinancePreference } from '@prisma/client';

export class UpdateApplicantDto {
  // Basic
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() alternateMobile?: string;
  @IsOptional() @IsString() whatsappNumber?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() assignedStaffId?: string;

  // Address
  @IsOptional() @IsString() addressHouse?: string;
  @IsOptional() @IsString() addressStreet?: string;
  @IsOptional() @IsString() addressVillage?: string;
  @IsOptional() @IsString() addressDistrictId?: string;
  @IsOptional() @IsString() addressStateId?: string;
  @IsOptional() @IsString() addressPincode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() gpsLatitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() gpsLongitude?: number;

  // Installation
  @IsOptional() @IsEnum(Discom) discom?: Discom;
  @IsOptional() @IsEnum(ProjectType) projectType?: ProjectType;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) systemCapacityKw?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) sanctionedLoadKw?: number;
  @IsOptional() @IsString() roofType?: string;
  @IsOptional() @IsString() existingConsumerNo?: string;
  @IsOptional() @IsString() discomRefNo?: string;

  // Finance
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) contractAmount?: number;
  @IsOptional() @IsEnum(FinancePreference) financeMode?: FinancePreference;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) loanAmount?: number;
  @IsOptional() @IsString() loanSanctionedDate?: string;
  @IsOptional() @IsString() overpaymentRule?: string;

  // Survey
  @IsOptional() @IsString() surveyDate?: string;
  @IsOptional() @IsString() surveyedBy?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) roofAreaSqft?: number;
  @IsOptional() @IsString() shadowAnalysis?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) recommendedCapacityKw?: number;

  // DISCOM Application
  @IsOptional() @IsString() portalApplicationDate?: string;
  @IsOptional() @IsString() jeName?: string;
  @IsOptional() @IsString() jeContact?: string;
  @IsOptional() @IsString() mrtDate?: string;
  @IsOptional() @IsString() inspectionDate?: string;
  @IsOptional() @IsString() inspectionResult?: string;
  @IsOptional() @IsString() netMeterSerialNo?: string;

  // Subsidy
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) expectedSubsidyAmount?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) actualSubsidyReceived?: number;
  @IsOptional() @IsString() subsidyReceivedDate?: string;
  @IsOptional() @IsString() discomBankReference?: string;
}
