import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePaymentMethodDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
