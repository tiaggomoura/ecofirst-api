import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FindTransactionsDto } from './dto/find-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private service: TransactionsService) {}

  /**
   * Cria 1 ou N transações (parcelas), conforme dto.repeatCount.
   * - status sempre inicia como 'PENDENTE'
   * - amount deve chegar como string "23200.00" ou número seguro (o service trata Decimal)
   * - date deve ser ISO (ex.: "2025-08-01T00:00:00.000Z")
   */
  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('paginated')
  async findAllWithFilter(@Query() dto: FindTransactionsDto) {
    return this.service.findAllWithFilter(dto);
  }

  @Get('recent-activity')
  async getRecentActivity(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('type') type?: 'RECEITA' | 'DESPESA',
    @Query('status')
    status?: 'PENDENTE' | 'PAGO' | 'RECEBIDO' | 'CANCELADO',
  ) {
    return this.service.findRecentActivity({
      from,
      to,
      page,
      limit,
      type,
      status,
    });
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id).then((result) => ({
      ...result,
      amount: Number(result.amount.toFixed(2)),
    }));
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.service.update(id, dto).then((result) => ({
      ...result,
      amount: Number(result.amount.toFixed(2)),
    }));
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.delete(id);
  }
}
