import { HardhatAdapter } from '../infrastructure/blockchain/hardhat-adapter';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';

export class EscrowOrchestrator {
  constructor(
    private readonly blockchain: HardhatAdapter,
    private readonly messaging: RabbitMQAdapter
  ) {}

  async onPaymentReceived(event: any): Promise<void> {
    // In a real scenario, we'd get the provider address and amount from the Agreement Read Model
    const providerAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat #1
    const amountEth = '0.1';

    try {
      const txHash = await this.blockchain.lockFunds(event.aggregateId, providerAddress, amountEth);
      console.log('Funds locked on-chain:', txHash);

      await this.messaging.publish('domain_events', 'agreement.FUNDS_LOCKED', {
        type: 'FUNDS_LOCKED',
        aggregateId: event.aggregateId,
        txHash
      });
    } catch (error) {
      console.error('Failed to lock funds on-chain:', error);
    }
  }
}
