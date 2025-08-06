import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentMethodDto): Promise<CreatePaymentMethodDto> {
    const paymentMethodExistente = await this.prisma.paymentMethod.findFirst({
      where: {
        name: dto.name,
      },
    });
    if (paymentMethodExistente) {
      throw new BadRequestException(
        'Já existe um método de pagamento com esse nome.',
      );
    }
    return this.prisma.paymentMethod.create({ data: dto });
  }

  findAll() {
    return this.prisma.paymentMethod.findMany({ orderBy: { name: 'asc' } });
  }
}
