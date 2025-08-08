import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { TransactionType } from '@prisma/client';
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

  @IsNumber()
  categoryId: number;

  @IsNumber()
  paymentMethodId: number;
}
