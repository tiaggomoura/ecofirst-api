import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class UpdateTransactionDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumber()
  amount: Decimal;

  @IsDateString()
  date: Date;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsNumber()
  categoryId: number;

  @IsNumber()
  paymentMethodId: number;

  @IsOptional()
  @IsDateString()
  updatedAt?: Date;
}
