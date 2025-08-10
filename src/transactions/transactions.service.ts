import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { $Enums, Prisma, Transaction } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FindTransactionsDto } from './dto/find-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { randomUUID } from 'crypto';

type FindParams = {
  type?: 'RECEITA' | 'DESPESA';
  status?: 'PENDENTE' | 'PAGO' | 'RECEBIDO';
  description?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
};

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    // ---------- validações básicas ----------
    if (!dto?.description)
      throw new BadRequestException('description é obrigatório');
    if (dto?.amount === undefined || dto?.amount === null)
      throw new BadRequestException('amount é obrigatório');
    if (!dto?.date) throw new BadRequestException('date é obrigatório');
    if (!dto?.type) throw new BadRequestException('type é obrigatório');
    if (!dto?.categoryId)
      throw new BadRequestException('categoryId é obrigatório');
    if (!dto?.paymentMethodId)
      throw new BadRequestException('paymentMethodId é obrigatório');

    // ---------- helpers ----------
    const normalizeAmount = (val: unknown): Prisma.Decimal => {
      // Aceita: Prisma.Decimal | number | string ("23200.00" ou "23.200,00")
      if (val instanceof Prisma.Decimal) return val;
      if (typeof val === 'number') return new Prisma.Decimal(val);
      if (typeof val === 'string') {
        // remove "R$", espaços e adapta "23.200,00" -> "23200.00"
        const cleaned = val
          .replace(/[^\d,.\-]/g, '')
          .replace(/\./g, '')
          .replace(',', '.');
        return new Prisma.Decimal(cleaned);
      }
      throw new BadRequestException('amount inválido');
    };

    const addMonths = (d: Date, months: number): Date => {
      const x = new Date(d);
      // previne “overshoot” em finais de mês
      const day = x.getDate();
      x.setMonth(x.getMonth() + months, 1);
      const lastDay = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
      x.setDate(Math.min(day, lastDay));
      return x;
    };

    // ---------- normalizações ----------
    const baseDate = new Date(dto.date);
    if (isNaN(baseDate.getTime()))
      throw new BadRequestException('date inválida (use ISO-8601)');

    const total = normalizeAmount(dto.amount).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );

    const repeatCount = Math.max(1, Number(dto.repeatCount ?? 1));
    const distributeTotal = !!dto.distributeTotal;

    // Enums aceitam string no Prisma v6; se quiser, tipa como Prisma.$Enums.TransactionType
    const type: $Enums.TransactionType = dto.type;

    // IDs relacionais
    const categoryId = Number(dto.categoryId);
    const paymentMethodId = Number(dto.paymentMethodId);
    if (!Number.isFinite(categoryId) || !Number.isFinite(paymentMethodId)) {
      throw new BadRequestException(
        'categoryId e paymentMethodId devem ser numéricos',
      );
    }

    // ---------- calcula valores por parcela (ajuste de centavos) ----------
    let perInstallment: Prisma.Decimal[];
    if (distributeTotal && repeatCount > 1) {
      const base = total.div(repeatCount);
      const rounded = base.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      const sumRounded = rounded.mul(repeatCount);
      let diff = total.minus(sumRounded); // típico: 0.01 ou -0.01

      perInstallment = Array.from({ length: repeatCount }, () => rounded);
      let i = 0;
      while (!diff.isZero()) {
        const step = new Prisma.Decimal(diff.isPos() ? '0.01' : '-0.01');
        perInstallment[i] = perInstallment[i].plus(step);
        diff = diff.minus(step);
        i = (i + 1) % repeatCount;
      }
    } else {
      // repete o mesmo valor em todas, total final será repeatCount * amount
      perInstallment = Array.from({ length: repeatCount }, () => total);
    }

    // ---------- serie sempre presente (mesmo 1 parcela) ----------
    const seriesId = randomUUID();

    // ---------- monta payload ----------
    const data: Prisma.TransactionCreateManyInput[] = perInstallment.map(
      (value, idx) => ({
        description: dto.description,
        amount: value,
        date: addMonths(baseDate, idx),
        type,
        status: 'PENDENTE', // regra do projeto
        categoryId,
        paymentMethodId,
        seriesId,
        installmentNumber: idx + 1,
        installmentTotal: repeatCount,
      }),
    );

    // ---------- persiste atomizado e retorna ----------
    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.createMany({
        data,
        // se futuramente tiver unique, pode habilitar:
        // skipDuplicates: true,
      });
    });

    // Retorno “amigável”:
    if (repeatCount === 1) {
      // retorna o único registro
      return this.prisma.transaction.findFirstOrThrow({
        where: { seriesId, installmentNumber: 1 },
      });
    }

    // retorna a lista de parcelas criadas (ordenada)
    return this.prisma.transaction.findMany({
      where: { seriesId },
      orderBy: { installmentNumber: 'asc' },
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

  async update(id: number, dto: UpdateTransactionDto): Promise<Transaction> {
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
        status: dto.status,
        categoryId: dto.categoryId,
        paymentMethodId: dto.paymentMethodId,
        updatedAt: new Date(),
      },
    });
  }

  async findPaginated(filters: FindParams) {
    const { type, status, description, from, to, page, limit } = filters;

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

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        take: limit,
        skip,
        orderBy: { date: 'desc' },
        include: {
          category: true,
          paymentMethod: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // se você mapeia nomes no front, pode devolver já pronto:
    const mapped = items.map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      date: t.date,
      type: t.type,
      status: t.status,
      categoryName: t.category?.name ?? '',
      paymentMethodName: t.paymentMethod?.name ?? '',
    }));

    return { items: mapped, totalPages, total };
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
    const { type, status, description, from, to, page = 1 } = dto;
    const take = 10;
    const skip = (page - 1) * take;

    const where: Prisma.TransactionWhereInput = {};

    if (type) where.type = type;
    if (status) where.status = status;
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
        status: t.status,
        categoryName: t.category.name,
        paymentMethodName: t.paymentMethod.name,
        installmentNumber: t.installmentNumber,
        installmentTotal: t.installmentTotal
      })),
      totalPages,
    };
  }
}
