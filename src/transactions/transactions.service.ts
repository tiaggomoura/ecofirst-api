import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FindTransactionsDto } from './dto/find-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        type: dto.type,
        categoryId: dto.categoryId,
        paymentMethodId: dto.paymentMethodId,
      },
    });
  }

  async findById(id: number) {
    const transacao = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        category: true,
        paymentMethod: true,
      },
    });

    if (!transacao) {
      throw new NotFoundException('Transação não encontrada.');
    }
    return transacao;
  }

  async delete(id: number): Promise<void> {
    const transacao = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transacao) {
      throw new NotFoundException('Transação não encontrada.');
    }

    await this.prisma.transaction.delete({
      where: { id },
    });
  }

  async update(
    id: number,
    dto: UpdateTransactionDto,
  ): Promise<UpdateTransactionDto> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) throw new NotFoundException('Transaction not found.');

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found.');

    if (category.type !== dto.type) {
      throw new BadRequestException(
        'Transaction type must match category type.',
      );
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        type: dto.type,
        categoryId: dto.categoryId,
        paymentMethodId: dto.paymentMethodId,
      },
    });
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      include: {
        category: true,
        paymentMethod: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findAllWithFilter(dto: FindTransactionsDto) {
    const { type, description, from, to, page = 1 } = dto;
    const take = 10;
    const skip = (page - 1) * take;

    const where: Prisma.TransactionWhereInput = {};

    if (type) where.type = type;
    if (description)
      where.description = { contains: description, mode: 'insensitive' };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: {
          category: true,
          paymentMethod: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      items: items.map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.date,
        type: t.type,
        categoryName: t.category.name,
        paymentMethodName: t.paymentMethod.name,
      })),
      totalPages,
    };
  }
}
