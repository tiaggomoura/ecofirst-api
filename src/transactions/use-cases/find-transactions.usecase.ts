import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TransactionRepository } from '../repositories/transaction.repository';
import { PAGE_SIZE } from '../constants';

export type FindParams = {
  type?: 'RECEITA' | 'DESPESA';
  status?: 'PENDENTE' | 'PAGO' | 'RECEBIDO' | 'CANCELADO';
  description?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class FindTransactionsUseCase {
  constructor(private readonly repo: TransactionRepository) {}

  async execute(filters: FindParams) {
    const { type, status, description, from, to } = filters;
    const page = Math.max(1, Number(filters.page ?? 1));
    const take = Math.max(1, Math.min(Number(filters.limit ?? PAGE_SIZE), 100));
    const skip = (page - 1) * take;

    const where: Prisma.TransactionWhereInput = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(description
        ? { description: { contains: description, mode: 'insensitive' } }
        : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.repo.findManyWithFilter(where, skip, take),
      this.repo.count(where),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / take),
      page,
      pageSize: take,
    };
  }
}
