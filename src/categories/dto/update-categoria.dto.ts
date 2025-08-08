import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class UpdateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(TransactionType)
  type: TransactionType;
}
