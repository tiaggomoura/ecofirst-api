import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    return this.prisma.transaction.create({ data: dto });
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

  async findAll() {
    return this.prisma.transaction.findMany({
      include: {
        category: true,
        paymentMethod: true,
      },
      orderBy: { date: 'desc' },
    });
  }
}
