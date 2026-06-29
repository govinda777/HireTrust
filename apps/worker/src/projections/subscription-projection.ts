import { PrismaClient } from '@hiretrust/database';

export class SubscriptionProjection {
  constructor(private readonly prisma: PrismaClient) {}

  async handleSubscriptionCreated(event: any): Promise<void> {
    await this.prisma.subscription.create({
      data: {
        id: event.aggregateId,
        subscriberId: event.subscriberId,
        agreementId: event.agreementId,
        planId: event.planId,
        intervalInDays: event.intervalInDays,
        price: event.price,
        status: 'DRAFT'
      }
    });
  }

  async handleCycleStarted(event: any): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: event.aggregateId },
        data: { status: 'PENDING_PAYMENT' }
      }),
      this.prisma.billingCycle.create({
        data: {
          id: event.cycleId,
          subscriptionId: event.aggregateId,
          cycleNumber: event.cycleNumber,
          status: 'PENDING',
          dueDate: new Date(event.dueDate)
        }
      })
    ]);
  }

  async handlePaymentConfirmed(event: any): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: event.aggregateId },
        data: { status: 'ACTIVE' }
      }),
      this.prisma.billingCycle.update({
        where: { id: event.cycleId },
        data: {
          status: 'PAID',
          paymentDate: new Date(event.paymentDate || new Date())
        }
      })
    ]);
  }

  async handleFundsLocked(event: any): Promise<void> {
    await this.prisma.billingCycle.update({
      where: { id: event.cycleId },
      data: { status: 'IN_ESCROW' }
    });
  }

  async handleCycleCompleted(event: any): Promise<void> {
    await this.prisma.billingCycle.update({
      where: { id: event.cycleId },
      data: {
        status: 'RELEASED',
        proofHash: event.proofHash
      }
    });
  }

  async handleSubscriptionCancelled(event: any): Promise<void> {
    await this.prisma.subscription.update({
      where: { id: event.aggregateId },
      data: { status: 'CANCELLED' }
    });
  }
}
