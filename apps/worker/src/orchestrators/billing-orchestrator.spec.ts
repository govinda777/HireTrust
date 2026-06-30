import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingOrchestrator } from './billing-orchestrator';
import { BlockchainProvider } from '../application/ports/blockchain-provider.interface';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { PrismaClient } from '@hiretrust/database';

describe('BillingOrchestrator', () => {
  let orchestrator: BillingOrchestrator;
  let mockBlockchain: BlockchainProvider;
  let mockMessaging: RabbitMQAdapter;
  let mockPrisma: any;

  beforeEach(() => {
    mockBlockchain = {
      lockFunds: vi.fn().mockResolvedValue('0x-tx-hash'),
    };
    mockMessaging = {
      publish: vi.fn().mockResolvedValue(undefined),
    } as any;
    mockPrisma = {
      subscription: {
        findUnique: vi.fn().mockResolvedValue({ id: 'sub-1', agreementId: 'agr-1', price: 0.1 }),
      },
      agreement: {
        findUnique: vi.fn().mockResolvedValue({ id: 'agr-1', providerId: '0x-provider' }),
      },
    };

    orchestrator = new BillingOrchestrator(mockBlockchain, mockMessaging, mockPrisma as any);
  });

  it('should lock funds on-chain when payment is confirmed', async () => {
    const event = { aggregateId: 'sub-1', cycleId: 'sub-1_cycle1' };
    await orchestrator.onPaymentConfirmed(event);

    expect(mockBlockchain.lockFunds).toHaveBeenCalledWith('sub-1_cycle1', '0x-provider', '0.1');
    expect(mockMessaging.publish).toHaveBeenCalledWith('domain_events', 'subscription.FUNDS_LOCKED_IN_ESCROW', expect.objectContaining({
      txHash: '0x-tx-hash'
    }));
  });
});
