import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { CryptoPaymentDto, StripeCheckoutDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout/stripe')
  async createStripeSession(@Req() req: any, @Body() body: StripeCheckoutDto) {
    return this.paymentsService.initiateStripePayment(req.user.id, body.amount, body.currency);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout/crypto')
  async recordCryptoPayment(@Req() req: any, @Body() body: CryptoPaymentDto) {
    return this.paymentsService.initiateBlockchainPayment(
      req.user.id, body.amount, body.currency, body.txHash, body.network, body.method,
    );
  }

  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(@Headers('stripe-signature') signature: string, @Req() req: any) {
    if (!signature) return { received: false };
    return this.paymentsService.processWebhook(req.rawBody, signature);
  }
}
