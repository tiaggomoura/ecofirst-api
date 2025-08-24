import { Injectable, NotFoundException } from '@nestjs/common';
import { $Enums, Prisma } from '@prisma/client';
import { toMoney2 } from './domain/money';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FindTransactionsDto } from './dto/find-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { toListItemDTO } from './mappers/transaction.mapper';
import { TransactionRepository } from './repositories/transaction.repository';
import { CreateTransactionUseCase } from './use-cases/create-transaction.usecase';
import { FindTransactionsUseCase } from './use-cases/find-transactions.usecase';
import { FindRecentActivityUseCase } from './use-cases/find-recent-activity.usecase';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repo: TransactionRepository,
    private readonly createUC: CreateTransactionUseCase,
    private readonly findUC: FindTransactionsUseCase,
    private readonly findRecentActivityUC: FindRecentActivityUseCase,
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

  async findRecentActivity(dto: FindTransactionsDto) {
    const now = new Date();

    const from = dto.from
      ? new Date(dto.from)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    const to = dto.to
      ? new Date(dto.to)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.findRecentActivityUC.execute(
      from,
      to,
      dto.page || 1,
      dto.limit || 10,
    );
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

  /**
   * Liquida a transação:
   * - DESPESA (PENDENTE)  -> PAGO
   * - RECEITA (PENDENTE)  -> RECEBIDO
   * - Já PAGO/RECEBIDO    -> idempotente (true)
   * Retorno:
   * - false  -> não encontrada
   * - true   -> sucesso (inclui idempotência)
   */
  async settle(id: number): Promise<boolean> {
    const tx = await this.repo.findById(id);
    if (!tx) return false;

    // Idempotência: já liquidada
    if (
      tx.status === $Enums.TransactionStatus.PAGO ||
      tx.status === $Enums.TransactionStatus.RECEBIDO
    ) {
      return true;
    }

    // Apenas quando PENDENTE escolhemos o novo status conforme o type
    if (tx.status === $Enums.TransactionStatus.PENDENTE) {
      if (tx.type === $Enums.TransactionType.DESPESA) {
        await this.repo.markAsPaid(id); // DESPESA -> PAGO
      } else {
        await this.repo.markAsReceived(id); // RECEITA -> RECEBIDO
      }
      return true;
    }
    return true;
  }
}
