import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  commissionStructureId: string;

  @IsDateString()
  effectiveFrom: string;
}
