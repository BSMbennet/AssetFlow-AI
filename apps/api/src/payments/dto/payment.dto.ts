import { IsEnum, IsNumber, IsString, Matches, MaxLength, Min } from 'class-validator';

export class StripeCheckoutDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsString()
  @Matches(/^[A-Za-z]{3}$/)
  currency!: string;
}

export class CryptoPaymentDto {
  @IsNumber({ maxDecimalPlaces: 18 })
  @Min(0.00000001)
  amount!: number;

  @IsString()
  @Matches(/^[A-Za-z0-9]{2,12}$/)
  currency!: string;

  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/)
  txHash!: string;

  @IsString()
  @MaxLength(32)
  network!: string;

  @IsEnum(['USDC', 'USDT', 'CRYPTO'])
  method!: 'USDC' | 'USDT' | 'CRYPTO';
}
