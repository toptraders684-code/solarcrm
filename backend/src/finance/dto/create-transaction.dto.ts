import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { TransactionType, PaymentMethod } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  applicantId: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;
}
