import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  name: string;
}
