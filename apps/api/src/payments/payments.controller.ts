import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout/fiat')
  async createFiatIntent(@Req() req, @Body() body: { assetId: string; amount: number }) {
    return this.paymentsService.createStripePaymentIntent(req.user.id, body.assetId, body.amount);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout/crypto')
  async recordCryptoPayment(@Req() req, @Body() body: { assetId: string; amount: number; txHash: string; method: 'STABLECOIN_USDC' | 'CRYPTO_NATIVE' }) {
    return this.paymentsService.processCryptoTransaction(req.user.id, body.assetId, body.amount, body.txHash, body.method);
  }
}