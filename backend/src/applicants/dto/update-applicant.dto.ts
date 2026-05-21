import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FinancePreference } from '@prisma/client';

export class UpdateApplicantDto {
  // Basic
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() customerProfession?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() alternateMobile?: string;
  @IsOptional() @IsString() whatsappNumber?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() panToken?: string;
  @IsOptional() @IsString() aadhaarToken?: string;
  @IsOptional() @IsString() assignedStaffId?: string;

  // Address
  @IsOptional() @IsString() addressHouse?: string;
  @IsOptional() @IsString() addressStreet?: string;
  @IsOptional() @IsString() addressVillage?: string;
  @IsOptional() @IsString() addressGp?: string;
  @IsOptional() @IsString() addressBlock?: string;
  @IsOptional() @IsString() addressDistrictId?: string;
  @IsOptional() @IsString() addressStateId?: string;
  @IsOptional() @IsString() addressPincode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() gpsLatitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() gpsLongitude?: number;

  // Bank Details
  @IsOptional() @IsString() bankNameInAccount?: string;
  @IsOptional() @IsString() bankBranchName?: string;
  @IsOptional() @IsString() bankAccountNumber?: string;
  @IsOptional() @IsString() bankIfscCode?: string;
  @IsOptional() @IsString() coApplicantName?: string;
  @IsOptional() @IsString() coApplicantRelationship?: string;
  @IsOptional() @IsString() coApplicantMobile?: string;
  @IsOptional() @IsString() coApplicantOccupation?: string;

  // Area Details
  @IsOptional() @IsString() areaHouseNo?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) areaRoofSizeSqft?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) areaNoOfFloors?: number;
  @IsOptional() @IsString() areaRoofType?: string;
  @IsOptional() @IsString() areaHouseHeight?: string;

  // Installation
  @IsOptional() @IsString() discom?: string;
  @IsOptional() @IsString() projectType?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) systemCapacityKw?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) sanctionedLoadKw?: number;
  @IsOptional() @IsString() roofType?: string;
  @IsOptional() @IsString() existingConsumerNo?: string;
  @IsOptional() @IsString() discomRefNo?: string;

  // Finance
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) contractAmount?: number;
  @IsOptional() @IsString() invoiceNo?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) solarRate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) solarGst?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) installationRate?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) installationGst?: number;
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
  // DISCOM Details
  @IsOptional() @IsString() mnreApplicationNo?: string;
  @IsOptional() @IsString() discomApplicationNo?: string;
  @IsOptional() @IsString() mnreSubmitDate?: string;
  @IsOptional() @IsString() discomDivision?: string;
  @IsOptional() @IsString() discomSubDivision?: string;
  @IsOptional() @IsString() discomSection?: string;
  @IsOptional() @IsString() discomContactPerson?: string;
  @IsOptional() @IsString() discomMobileNo?: string;
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
