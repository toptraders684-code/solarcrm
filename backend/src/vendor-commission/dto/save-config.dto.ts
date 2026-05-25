import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfigEntryDto {
  @IsString()
  @IsNotEmpty()
  configKey: string;

  @IsString()
  configValue: string;
}

export class SaveConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigEntryDto)
  configs: ConfigEntryDto[];
}
