import { BlockchainProvider } from '../application/ports/blockchain-provider.interface';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { PrismaClient } from '@hiretrust/database';

export class BillingOrchestrator {
  constructor(
    private readonly blockchain: BlockchainProvider,
    private readonly messaging: RabbitMQAdapter,
    private readonly prisma: PrismaClient
  ) {}

  async onPaymentConfirmed(event: any): Promise<void> {
    const { aggregateId, cycleId } = event;
    console.log(`Payment confirmed for subscription ${aggregateId}, cycle ${cycleId}. Engaging EscrowEngine...`);

    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: aggregateId }
      });

      if (!subscription) {
        console.error(`Subscription ${aggregateId} not found in read model`);
        return;
      }

      const agreement = await this.prisma.agreement.findUnique({
        where: { id: subscription.agreementId }
      });

      if (!agreement) {
        console.error(`Agreement ${subscription.agreementId} not found for subscription ${aggregateId}`);
        return;
      }

      const providerAddress = agreement.providerId.startsWith('0x')
        ? agreement.providerId
        : process.env.PROVIDER_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

      const amountEth = subscription.price.toString();

      const txHash = await this.blockchain.lockFunds(cycleId, providerAddress, amountEth);
      console.log(`Funds locked for cycle ${cycleId}: ${txHash}`);

      await this.messaging.publish('domain_events', 'subscription.FUNDS_LOCKED_IN_ESCROW', {
        type: 'FUNDS_LOCKED_IN_ESCROW',
        aggregateId,
        cycleId,
        txHash
      });
    } catch (error) {
      console.error(`Failed to engage EscrowEngine for cycle ${cycleId}:`, error);
    }
  }

  async onSlaValidated(event: any): Promise<void> {
    const { cycleId, proofHash, aggregateId } = event;
    console.log(`SLA Validated for cycle ${cycleId}. Releasing funds...`);

    try {
      const txHash = await this.blockchain.releaseFunds(cycleId, proofHash);
      console.log(`Funds released for cycle ${cycleId} on-chain: ${txHash}`);

      await this.messaging.publish('domain_events', 'subscription.CYCLE_COMPLETED', {
        type: 'CYCLE_COMPLETED',
        aggregateId,
        cycleId,
        proofHash,
        txHash
      });
    } catch (error) {
      console.error(`Failed to release funds for cycle ${cycleId}:`, error);
    }
  }

  async onSlaViolated(event: any): Promise<void> {
    const { cycleId, reason, aggregateId } = event;
    console.log(`SLA Violated for cycle ${cycleId}: ${reason}. Marking as DISPUTED.`);

    await this.messaging.publish('domain_events', 'subscription.CYCLE_DISPUTED', {
      type: 'CYCLE_DISPUTED',
      aggregateId,
      cycleId,
      reason
    });
  }
}
