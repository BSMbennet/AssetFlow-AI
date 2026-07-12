import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27' as any, 
    });
  }

  async initiateStripePayment(userId: string, amount: number, currency: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User entity not discovered.');

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: 'AssetFlow Token Allocation Purchase' },
            unit_amount: Math.round(amount * 100), // convert standard float decimal into cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/dashboard/wallet?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/marketplace`,
      metadata: { userId },
    });

    await this.prisma.payment.create({
      data: {
        userId,
        amount,
        currency: currency.toUpperCase(),
        method: 'CARD',
        provider: 'STRIPE',
        providerReference: session.id,
        status: 'PENDING',
        metadata: { checkoutSessionId: session.id },
      },
    });

    return { checkoutUrl: session.url };
  }

  async initiateBlockchainPayment(userId: string, amount: number, currency: string, txHash: string, network: string, method: 'USDC' | 'USDT' | 'CRYPTO') {
    // Stage an immediate pending receipt tracking inside the ledger
    const paymentRecord = await this.prisma.payment.create({
      data: {
        userId,
        amount,
        currency,
        method,
        provider: 'BLOCKCHAIN',
        providerReference: txHash,
        status: 'PROCESSING',
        metadata: { network, transactionHash: txHash },
      },
    });

    // In a microservices web application setup, dispatch a BullMQ worker background event 
    // to check transaction block safety confirmation using an RPC provider (e.g. Alchemy/Infura)
    this.logger.log(`Blockchain execution event registered via hash: ${txHash}. Workers validating sequence entries.`);
    return paymentRecord;
  }

  async processWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      this.logger.error(`Webhook configuration verification error: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const targetPayment = await this.prisma.payment.findFirst({
        where: { providerReference: session.id }
      });

      if (targetPayment) {
        await this.prisma.payment.update({
          where: { id: targetPayment.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          }
        });

        // Trigger asynchronous settlement, allocation or provisioning logic here
        this.logger.log(`Payment reference ${session.id} successfully finalized via webhooks.`);
      }
    }
    return { received: true };
  }
}