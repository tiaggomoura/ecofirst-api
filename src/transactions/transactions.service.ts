import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toMoney2 } from './domain/money';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FindTransactionsDto } from './dto/find-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { toListItemDTO } from './mappers/transaction.mapper';
import { TransactionRepository } from './repositories/transaction.repository';
import { CreateTransactionUseCase } from './use-cases/create-transaction.usecase';
import { FindTransactionsUseCase } from './use-cases/find-transactions.usecase';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repo: TransactionRepository,
    private readonly createUC: CreateTransactionUseCase,
    private readonly findUC: FindTransactionsUseCase,
  ) {}

  async create(dto: CreateTransactionDto) {
    return this.createUC.execute(dto);
  }

  async findAll() {
    const items = await this.repo.findAllOrdered();
    return items.map(toListItemDTO);
  }

  async findAllWithFilter(dto: FindTransactionsDto) {
    // Remove "CANCELADO" from status if present
    const { status, ...rest } = dto;
    const allowedStatus = status === 'CANCELADO' ? undefined : status;
    const result = await this.findUC.execute({
      ...rest,
      status: allowedStatus,
    });
    return {
      ...result,
      items: result.items.map(toListItemDTO),
    };
  }

  async findPaginated(dto: FindTransactionsDto) {
    return this.findAllWithFilter(dto); // reaproveita o UC
  }

  async findById(id: number) {
    const tx = await this.repo.findById(id);
    if (!tx) throw new NotFoundException('Transaction not found.');
    return tx;
  }

  async update(id: number, dto: UpdateTransactionDto) {
    const exists = await this.repo.findById(id);
    if (!exists) throw new NotFoundException('Transaction not found.');

    // Monta um TransactionUpdateInput (checado)
    const data: Prisma.TransactionUpdateInput = {
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.amount !== undefined ? { amount: toMoney2(dto.amount) } : {}),
      ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.categoryId !== undefined
        ? { category: { connect: { id: Number(dto.categoryId) } } }
        : {}),
      ...(dto.paymentMethodId !== undefined
        ? { paymentMethod: { connect: { id: Number(dto.paymentMethodId) } } }
        : {}),
      updatedAt: new Date(),
    };

    return this.repo.update(id, data);
  }

  async delete(id: number) {
    await this.repo.delete(id);
  }
}
