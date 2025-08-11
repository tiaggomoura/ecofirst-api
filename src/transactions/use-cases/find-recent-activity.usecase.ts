import { Injectable } from '@nestjs/common';
import { TransactionRepository } from '../repositories/transaction.repository';

@Injectable()
export class FindRecentActivityUseCase {
  constructor(private readonly repo: TransactionRepository) {}

  async execute(from: Date, to: Date, page: number, limit: number) {
    return this.repo.findRecentActivity(from, to, page, limit);
  }
}
