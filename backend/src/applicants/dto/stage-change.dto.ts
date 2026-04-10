import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class StageChangeDto {
  @IsNumber()
  @Min(1)
  newStage: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
