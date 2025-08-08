import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

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

  async update(
    id: number,
    dto: UpdatePaymentMethodDto,
  ): Promise<UpdatePaymentMethodDto> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
    if (!paymentMethod)
      throw new NotFoundException('Payment method not found.');

    return this.prisma.paymentMethod.update({
      where: { id },
      data: {
        name: dto.name,
      },
    });
  }

  findAll() {
    return this.prisma.paymentMethod.findMany({ orderBy: { name: 'asc' } });
  }
}
