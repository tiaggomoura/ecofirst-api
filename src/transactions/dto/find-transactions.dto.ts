// src/transactions/dto/find-transactions.dto.ts
import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';

export class FindTransactionsDto {
  @IsOptional()
  seriesId?: string;

  @IsOptional()
  @IsString()
  type?: 'RECEITA' | 'DESPESA';

  @IsOptional()
  @IsString()
  @IsIn(['PENDENTE', 'PAGO', 'RECEBIDO', 'CANCELADO'])
  status?: 'PENDENTE' | 'PAGO' | 'RECEBIDO' | 'CANCELADO';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  from?: string; // ISO date

  @IsOptional()
  @IsString()
  to?: string; // ISO date

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  installmentNumber?: number;

  @IsOptional()
  @IsInt()
  installmentTotal?: number;
}
