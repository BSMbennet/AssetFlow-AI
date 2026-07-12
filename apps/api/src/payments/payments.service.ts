import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27' as any,
    });
  }

  async createStripePaymentIntent(userId: string, assetId: string, amount: number) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new BadRequestException('Asset not found');

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      metadata: { userId, assetId },
    });

    await this.prisma.payment.create({
      data: {
        userId,
        assetId,
        amount,
        methodType: 'STRIPE_CARD',
        gatewayRef: intent.id,
        status: 'PENDING',
      },
    });

    return { clientSecret: intent.client_secret };
  }

  async processCryptoTransaction(userId: string, assetId: string, amount: number, txHash: string, method: 'STABLECOIN_USDC' | 'CRYPTO_NATIVE') {
    // In production, dispatch a BullMQ job to verify transaction receipt on-chain using an RPC node before saving status as COMPLETED.
    return this.prisma.payment.create({
      data: {
        userId,
        assetId,
        amount,
        methodType: method,
        gatewayRef: txHash,
        status: 'COMPLETED',
      },
    });
  }
}