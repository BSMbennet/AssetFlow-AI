import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe?: Stripe;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) this.stripe = new Stripe(key, { apiVersion: '2025-01-27.acacia' as any });
  }

  async initiateStripePayment(userId: string, amount: number, currency: string) {
    if (!this.stripe) throw new BadRequestException('Stripe payments are not configured');
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Invalid amount');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({ email: user.email, name: `${user.firstName} ${user.lastName}` });
      customerId = customer.id;
      await this.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId, payment_method_types: ['card'],
      line_items: [{ price_data: { currency: currency.toLowerCase(), product_data: { name: 'AssetFlow Token Allocation Purchase' }, unit_amount: Math.round(amount * 100) }, quantity: 1 }],
      mode: 'payment', success_url: `${frontend}/dashboard/wallet?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${frontend}/dashboard/marketplace`, metadata: { userId },
    });
    await this.prisma.payment.create({ data: { userId, amount, currency: currency.toUpperCase(), method: 'CARD', provider: 'STRIPE', providerReference: session.id, status: 'PENDING', metadata: { checkoutSessionId: session.id } } });
    return { checkoutUrl: session.url };
  }

  async initiateBlockchainPayment(userId: string, amount: number, currency: string, txHash: string, network: string, method: 'USDC' | 'USDT' | 'CRYPTO') {
    if (!txHash) throw new BadRequestException('Transaction hash is required');
    const paymentRecord = await this.prisma.payment.create({ data: { userId, amount, currency, method, provider: 'BLOCKCHAIN', providerReference: txHash, status: 'PROCESSING', metadata: { network, transactionHash: txHash } } });
    this.logger.log(`Blockchain payment staged: ${txHash}`);
    return paymentRecord;
  }

  async processWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) throw new BadRequestException('Stripe webhook is not configured');
    let event: Stripe.Event;
    try { event = this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET); }
    catch (err: any) { throw new BadRequestException(`Webhook Error: ${err.message}`); }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const payment = await this.prisma.payment.findFirst({ where: { providerReference: session.id } });
      if (payment) await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
    }
    return { received: true };
  }
}
