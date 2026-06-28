import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionProjection } from './subscription-projection';

describe('SubscriptionProjection', () => {
  let projection: SubscriptionProjection;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      subscription: {
        create: vi.fn(),
        update: vi.fn()
      },
      billingCycle: {
        create: vi.fn(),
        update: vi.fn()
      },
      $transaction: vi.fn((promises) => Promise.all(promises))
    };
    projection = new SubscriptionProjection(mockPrisma);
  });

  it('should create subscription on SUBSCRIPTION_CREATED', async () => {
    const event = {
      aggregateId: 'sub-1',
      subscriberId: 'user-1',
      agreementId: 'agr-1',
      planId: 'plan-1',
      intervalInDays: 30,
      price: 100
    };
    await projection.handleSubscriptionCreated(event);
    expect(mockPrisma.subscription.create).toHaveBeenCalled();
  });

  it('should create cycle on CYCLE_STARTED', async () => {
    const event = {
      aggregateId: 'sub-1',
      cycleId: 'sub-1_cycle1',
      cycleNumber: 1,
      dueDate: new Date()
    };
    await projection.handleCycleStarted(event);
    expect(mockPrisma.billingCycle.create).toHaveBeenCalled();
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'sub-1' },
        data: { status: 'PENDING_PAYMENT' }
    }));
  });
});
