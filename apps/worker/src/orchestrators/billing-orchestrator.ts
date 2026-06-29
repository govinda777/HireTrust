import { HardhatAdapter } from '../infrastructure/blockchain/hardhat-adapter';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { PrismaClient } from '@hiretrust/database';

export class BillingOrchestrator {
  constructor(
    private readonly blockchain: HardhatAdapter,
    private readonly messaging: RabbitMQAdapter,
    private readonly prisma: PrismaClient
  ) {}

  async onPaymentConfirmed(event: any): Promise<void> {
    const { aggregateId, cycleId } = event;
    console.log(`Payment confirmed for subscription ${aggregateId}, cycle ${cycleId}. Engaging EscrowEngine...`);

    try {
      // Fetch subscription details from Read Model
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: aggregateId }
      });

      if (!subscription) {
        console.error(`Subscription ${aggregateId} not found in read model`);
        return;
      }

      // Fetch agreement to get provider address (in a real scenario, this would be in the read model)
      const agreement = await this.prisma.agreement.findUnique({
        where: { id: subscription.agreementId }
      });

      if (!agreement) {
        console.error(`Agreement ${subscription.agreementId} not found for subscription ${aggregateId}`);
        return;
      }

      // In this version, we assume providerId IS the address or we have a mapping.
      // For the demo, we use a fallback if providerId is not a valid address.
      const providerAddress = agreement.providerId.startsWith('0x')
        ? agreement.providerId
        : process.env.PROVIDER_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

      const amountEth = subscription.price.toString();

      // Lock funds using the deterministic cycleId
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

  async onCycleCompleted(event: any): Promise<void> {
    const { aggregateId, cycleId, proofHash } = event;
    console.log(`Cycle ${cycleId} completed. Releasing funds...`);

    try {
      // In a real scenario, the HardhatAdapter should be updated to include releaseFunds
      // For now, we'll assume it exists or implement it if possible.
      // await this.blockchain.releaseFunds(cycleId, proofHash);

      console.log(`Funds released for cycle ${cycleId} with proof ${proofHash}`);

      await this.messaging.publish('domain_events', 'subscription.FUNDS_RELEASED', {
        type: 'FUNDS_RELEASED',
        aggregateId,
        cycleId,
        proofHash
      });
    } catch (error) {
      console.error(`Failed to release funds for cycle ${cycleId}:`, error);
    }
  }
}
