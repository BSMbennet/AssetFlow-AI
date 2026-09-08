import { IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, Length, MinLength } from 'class-validator';

export class CreateSettlementDto {
  @IsUUID()
  assetId!: string;

  @IsIn(['BUY', 'SELL'])
  direction!: 'BUY' | 'SELL';

  @IsNumberString()
  amount!: string;

  @IsIn(['USD', 'EUR', 'GBP'])
  currency!: string;

  @IsIn(['Bank rail', 'Stablecoin rail', 'Ethereum', 'Polygon'])
  settlementNetwork!: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  counterparty?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  reference?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @Length(8, 200)
  idempotencyKey?: string;
}

export class AdvanceSettlementDto {
  @IsIn(['ELIGIBILITY_CHECK', 'READY'])
  nextStatus!: 'ELIGIBILITY_CHECK' | 'READY';
}
