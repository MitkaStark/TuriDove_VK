import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  reservaId!: string;

  @IsNumber()
  @Min(0.5)
  amount!: number;

  @IsString()
  @IsOptional()
  description?: string;
}
