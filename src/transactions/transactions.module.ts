import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

import { TransactionRepository } from './repositories/transaction.repository';
import { CreateTransactionUseCase } from './use-cases/create-transaction.usecase';
import { FindTransactionsUseCase } from './use-cases/find-transactions.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionRepository,
    CreateTransactionUseCase,
    FindTransactionsUseCase,
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {}
