import { Controller, Post, Body, UseGuards, Req, Headers, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout/stripe')
  async createStripeSession(@Req() req: any, @Body() body: { amount: number; currency: string }) {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('Invalid transaction total amount.');
    }
    return this.paymentsService.initiateStripePayment(req.user.id, body.amount, body.currency || 'USD');
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout/crypto')
  async recordCryptoPayment(
    @Req() req: any,
    @Body() body: { amount: number; currency: string; txHash: string; network: string; method: 'USDC' | 'USDT' | 'CRYPTO' }
  ) {
    return this.paymentsService.initiateBlockchainPayment(
      req.user.id,
      body.amount,
      body.currency,
      body.txHash,
      body.network,
      body.method
    );
  }

  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(@Headers('stripe-signature') signature: string, @Req() req: any) {
    if (!signature) throw new BadRequestException('Missing validation parameter signature.');
    return this.paymentsService.processWebhook(req.rawBody, signature);
  }
}