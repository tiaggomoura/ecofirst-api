import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  amount: Decimal;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @IsNotEmpty()
  @IsNumber()
  paymentMethodId: number;

  // Recorrência
  @IsOptional()
  @IsInt()
  @Min(1)
  repeatCount?: number; // ex.: 12 (quantas serão criadas ao todo)

  /**
   * Se `distributeTotal = true`, o `amount` é o valor TOTAL da compra/receita,
   * e será dividido igualmente entre as `repeatCount` parcelas.
   * Se `false` (ou omitido), o `amount` é o valor POR parcela.
   */
  @IsOptional()
  distributeTotal?: boolean;
}
