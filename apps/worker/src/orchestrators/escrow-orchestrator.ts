import { BlockchainProvider } from '../application/ports/blockchain-provider.interface';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';

export class EscrowOrchestrator {
  constructor(
    private readonly blockchain: BlockchainProvider,
    private readonly messaging: RabbitMQAdapter
  ) {}

  async onPaymentReceived(event: any): Promise<void> {
    const providerAddress = process.env.PROVIDER_ADDRESS || '';
    const amountEth = process.env.DEFAULT_AMOUNT || '0.1';

    if (!providerAddress) {
      console.error('PROVIDER_ADDRESS not set, skipping lockFunds');
      return;
    }

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
