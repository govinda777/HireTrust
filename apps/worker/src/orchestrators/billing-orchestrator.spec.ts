import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingOrchestrator } from './billing-orchestrator';

describe('BillingOrchestrator', () => {
  let orchestrator: BillingOrchestrator;
  let mockBlockchain: any;
  let mockMessaging: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockBlockchain = {
      lockFunds: vi.fn().mockResolvedValue('0x-tx-hash'),
      releaseFunds: vi.fn().mockResolvedValue('0x-release-hash')
    };
    mockMessaging = {
      publish: vi.fn().mockResolvedValue(undefined)
    };
    mockPrisma = {
      subscription: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'sub-1',
          agreementId: 'agr-1',
          price: 100
        })
      },
      agreement: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'agr-1',
          providerId: '0x-provider'
        })
      }
    };

    orchestrator = new BillingOrchestrator(mockBlockchain, mockMessaging, mockPrisma);
  });

  it('should lock funds on-chain when payment is confirmed', async () => {
    const event = { aggregateId: 'sub-1', cycleId: 'sub-1_cycle1' };
    await orchestrator.onPaymentConfirmed(event);

    expect(mockBlockchain.lockFunds).toHaveBeenCalledWith(
      'sub-1_cycle1',
      '0x-provider',
      '100'
    );
    expect(mockMessaging.publish).toHaveBeenCalledWith(
      'domain_events',
      'subscription.FUNDS_LOCKED_IN_ESCROW',
      expect.objectContaining({ cycleId: 'sub-1_cycle1' })
    );
  });
});
