import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ProjectActivityType } from '@prisma/client';

export class CreateActivityDto {
  @IsEnum(ProjectActivityType)
  activityType: ProjectActivityType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
