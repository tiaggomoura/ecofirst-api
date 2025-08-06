import { TransactionType } from '@prisma/client';
import { IsNotEmpty, IsString, IsNumber, IsEnum } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;
}
