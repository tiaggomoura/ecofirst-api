import { Injectable, BadRequestException } from '@nestjs/common';
import { $Enums, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { TransactionRepository } from '../repositories/transaction.repository';
import { toMoney2 } from '../domain/money';
import { splitIntoInstallments } from '../domain/installment-calculator';
import { addMonthsSameDay } from '../domain/date-utils';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

@Injectable()
export class CreateTransactionUseCase {
  constructor(private readonly repo: TransactionRepository) {}

  async execute(dto: CreateTransactionDto) {
    // validações mínimas (o grosso pode ficar nos DTOs com class-validator)
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

    const baseDate = new Date(dto.date);
    if (isNaN(baseDate.getTime()))
      throw new BadRequestException('date inválida (use ISO-8601)');

    const total = toMoney2(dto.amount);
    const repeatCount = Math.max(1, Number(dto.repeatCount ?? 1));
    const distributeTotal = !!dto.distributeTotal;

    const type: $Enums.TransactionType = dto.type;
    const categoryId = Number(dto.categoryId);
    const paymentMethodId = Number(dto.paymentMethodId);
    if (!Number.isFinite(categoryId) || !Number.isFinite(paymentMethodId)) {
      throw new BadRequestException(
        'categoryId e paymentMethodId devem ser numéricos',
      );
    }

    // cálculo de parcelas
    const values: Prisma.Decimal[] = distributeTotal
      ? splitIntoInstallments(total, repeatCount)
      : Array.from({ length: repeatCount }, () => total);

    const seriesId = randomUUID();

    const data = values.map((value, idx) => ({
      description: dto.description,
      amount: value,
      date: addMonthsSameDay(baseDate, idx),
      type,
      status: 'PENDENTE' as const,
      categoryId,
      paymentMethodId,
      seriesId,
      installmentNumber: idx + 1,
      installmentTotal: repeatCount,
    }));

    await this.repo.createMany(data);

    if (repeatCount === 1) {
      // manter o mesmo comportamento: retornar o único registro
      return this.repo.findFirst({ seriesId, installmentNumber: 1 });
    }

    // série criada: retorno simples
    return {
      message: 'Série criada com sucesso',
      seriesId,
      count: repeatCount,
    };
  }
}
