import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import Stripe from 'stripe';

const SUPPORTED_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'ZAR']);
const SUPPORTED_NETWORKS = new Set(['ethereum', 'polygon', 'base', 'arbitrum', 'optimism']);

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
    const normalizedCurrency = currency.trim().toUpperCase();
    if (!Number.isFinite(amount) || amount < 0.01 || amount > 1_000_000) throw new BadRequestException('Invalid amount');
    if (!SUPPORTED_CURRENCIES.has(normalizedCurrency)) throw new BadRequestException('Unsupported currency');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === 'SUSPENDED' || user.deletedAt) throw new BadRequestException('User is not eligible for payment');

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({ email: user.email, name: `${user.firstName} ${user.lastName}`.trim() });
      customerId = customer.id;
      await this.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const frontend = process.env.FRONTEND_URL;
    if (!frontend) throw new InternalServerErrorException('Payment redirect configuration is missing');
    let frontendUrl: URL;
    try { frontendUrl = new URL(frontend); } catch { throw new InternalServerErrorException('Payment redirect configuration is invalid'); }
    if (process.env.NODE_ENV === 'production' && frontendUrl.protocol !== 'https:') throw new InternalServerErrorException('Payment redirect configuration is invalid');

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: normalizedCurrency.toLowerCase(), product_data: { name: 'AssetFlow Token Allocation Purchase' }, unit_amount: Math.round(amount * 100) }, quantity: 1 }],
      mode: 'payment',
      success_url: `${frontendUrl.origin}/dashboard/wallet?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl.origin}/dashboard/marketplace`,
      metadata: { userId },
    });
    if (!session.id || !session.url) throw new InternalServerErrorException('Payment session creation failed');

    await this.prisma.payment.create({ data: { userId, amount, currency: normalizedCurrency, method: 'CARD', provider: 'STRIPE', providerReference: session.id, status: 'PENDING', metadata: { checkoutSessionId: session.id } } });
    return { checkoutUrl: session.url };
  }

  async initiateBlockchainPayment(userId: string, amount: number, currency: string, txHash: string, network: string, method: 'USDC' | 'USDT' | 'CRYPTO') {
    const normalizedHash = txHash.trim();
    const normalizedNetwork = network.trim().toLowerCase();
    const normalizedCurrency = currency.trim().toUpperCase();
    if (!/^0x[a-fA-F0-9]{64}$/.test(normalizedHash)) throw new BadRequestException('Invalid transaction hash');
    if (!SUPPORTED_NETWORKS.has(normalizedNetwork)) throw new BadRequestException('Unsupported blockchain network');
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) throw new BadRequestException('Invalid amount');
    if (method !== 'CRYPTO' && normalizedCurrency !== method) throw new BadRequestException('Currency and payment method do not match');

    const existing = await this.prisma.payment.findFirst({ where: { provider: 'BLOCKCHAIN', providerReference: normalizedHash } });
    if (existing) throw new BadRequestException('Transaction hash has already been submitted');

    const paymentRecord = await this.prisma.payment.create({ data: { userId, amount, currency: normalizedCurrency, method, provider: 'BLOCKCHAIN', providerReference: normalizedHash, status: 'PROCESSING', metadata: { network: normalizedNetwork, transactionHash: normalizedHash, verification: 'PENDING_INDEPENDENT_CHAIN_CONFIRMATION' } } });
    this.logger.log(`Blockchain payment staged for independent verification: payment=${paymentRecord.id}`);
    return paymentRecord;
  }

  async processWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET || !rawBody?.length || !signature) throw new BadRequestException('Invalid webhook request');
    let event: Stripe.Event;
    try { event = this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET); }
    catch { throw new BadRequestException('Invalid webhook signature'); }

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid') return { received: true };
      const payment = await this.prisma.payment.findFirst({ where: { provider: 'STRIPE', providerReference: session.id } });
      if (payment && payment.status !== 'COMPLETED') {
        await this.prisma.payment.updateMany({ where: { id: payment.id, provider: 'STRIPE', status: { not: 'COMPLETED' } }, data: { status: 'COMPLETED', completedAt: new Date() } });
      }
    }
    return { received: true };
  }
}
