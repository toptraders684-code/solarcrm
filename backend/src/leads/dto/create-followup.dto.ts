import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { OutcomeType } from '@prisma/client';

export class CreateFollowupDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsEnum(OutcomeType)
  outcomeType: OutcomeType;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
