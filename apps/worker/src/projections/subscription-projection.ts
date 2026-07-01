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
        status: 'DRAFT',
        healthScore: 100
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

  async handleSlaMetricCaptured(event: any): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: event.aggregateId }
    });
    if (!sub) return;

    const policy = await this.prisma.slaPolicy.findUnique({
      where: { agreementId: sub.agreementId }
    });
    if (!policy) return;

    await this.prisma.slaMetric.create({
      data: {
        slaPolicyId: policy.id,
        cycleId: event.cycleId,
        type: event.metricType,
        value: event.value,
        timestamp: new Date(event.timestamp)
      }
    });
  }

  async handleSlaValidated(event: any): Promise<void> {
    // Increase health score slightly on success, capped at 100
    await this.prisma.subscription.update({
      where: { id: event.aggregateId },
      data: {
        healthScore: {
          increment: 1
        }
      }
    });

    // Ensure it doesn't exceed 100
    const sub = await this.prisma.subscription.findUnique({ where: { id: event.aggregateId } });
    if (sub && sub.healthScore > 100) {
      await this.prisma.subscription.update({
        where: { id: event.aggregateId },
        data: { healthScore: 100 }
      });
    }
  }

  async handleSlaViolated(event: any): Promise<void> {
    // Decrease health score on violation
    await this.prisma.subscription.update({
      where: { id: event.aggregateId },
      data: {
        healthScore: {
          decrement: 10
        }
      }
    });

    await this.prisma.billingCycle.update({
      where: { id: event.cycleId },
      data: {
        status: 'DISPUTED'
      }
    });
  }
}
