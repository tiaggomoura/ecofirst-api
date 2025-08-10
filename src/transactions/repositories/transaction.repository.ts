import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(data: Prisma.TransactionCreateManyInput[]) {
    return this.prisma.transaction.createMany({ data });
  }

  async findFirst(where: Prisma.TransactionWhereInput) {
    return this.prisma.transaction.findFirst({ where });
  }

  async findById(id: number) {
    return this.prisma.transaction.findUnique({ where: { id } });
  }

  async update(id: number, data: Prisma.TransactionUpdateInput) {
    return this.prisma.transaction.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.transaction.delete({ where: { id } });
  }

  async findManyWithFilter(
    where: Prisma.TransactionWhereInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.transaction.findMany({
      where,
      skip,
      take,
      orderBy: [{ id: 'asc' }, { date: 'desc' }],
      include: { category: true, paymentMethod: true },
    });
  }

  async count(where: Prisma.TransactionWhereInput) {
    return this.prisma.transaction.count({ where });
  }

  async findAllOrdered() {
    return this.prisma.transaction.findMany({
      include: { category: true, paymentMethod: true },
      orderBy: { date: 'desc' },
    });
  }
}
