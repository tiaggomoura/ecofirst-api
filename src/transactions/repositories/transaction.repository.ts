import { Injectable } from '@nestjs/common';
import { $Enums, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecentActivityDto } from '../dto/recent-activity.dto';

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

  async findRecentActivity(from: Date, to: Date, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          date: { gte: from, lte: to },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { category: true, paymentMethod: true },
      }),
      this.prisma.transaction.count({
        where: {
          date: { gte: from, lte: to },
        },
      }),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      pageSize: limit,
    };
  }

  /**
   * Monta o where a partir do DTO (sem regras de negócio, apenas tradução p/ Prisma).
   */
  private buildWhere(
    dto: Pick<
      RecentActivityDto,
      'from' | 'to' | 'type' | 'status' | 'description'
    >,
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {};

    if (dto.from || dto.to) {
      where.date = {};
      if (dto.from) where.date.gte = new Date(dto.from);
      if (dto.to) where.date.lte = new Date(dto.to);
    }
    if (dto.type) where.type = dto.type as $Enums.TransactionType;
    if (dto.status) where.status = dto.status as $Enums.TransactionStatus;
    if (dto.description) {
      where.description = { contains: dto.description, mode: 'insensitive' };
    }
    return where;
  }

  // Marca como PAGO
  async markAsPaid(id: number): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: { status: $Enums.TransactionStatus.PAGO },
    });
  }

  // Marca como RECEBIDO
  async markAsReceived(id: number): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: { status: $Enums.TransactionStatus.RECEBIDO },
    });
  }

  // Marcar como cancelado
  async markAsCanceled(id: number): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: { status: $Enums.TransactionStatus.CANCELADO },
    });
  }
}
