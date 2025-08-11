import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RecentActivityDto {
  @IsOptional()
  @IsString()
  from?: string;
  @IsOptional()
  @IsString()
  to?: string;

  // paginação
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  type?: 'RECEITA' | 'DESPESA';

  @IsOptional()
  @IsString()
  status?: 'PENDENTE' | 'PAGO' | 'RECEBIDO' | 'ATRASADO';

  @IsOptional()
  @IsString()
  description?: string;
}
