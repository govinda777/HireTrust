import { describe, it, expect } from 'vitest';
import { Subscription } from './subscription';

describe('Subscription Aggregate', () => {
  it('should create a subscription in DRAFT state', () => {
    const sub = Subscription.create('sub-1', 'user-1', 'agr-1', 'plan-1', 30, 100);
    expect(sub.status).toBe('DRAFT');
    expect(sub.getEvents()).toHaveLength(1);
    expect(sub.getEvents()[0].type).toBe('SUBSCRIPTION_CREATED');
  });

  it('should transition to PENDING_PAYMENT when a cycle starts', () => {
    const sub = Subscription.create('sub-1', 'user-1', 'agr-1', 'plan-1', 30, 100);
    sub.startCycle();
    expect(sub.status).toBe('PENDING_PAYMENT');
    expect(sub.cycles).toHaveLength(1);
    expect(sub.cycles[0].status).toBe('PENDING');
    expect(sub.getEvents()).toContainEqual(expect.objectContaining({ type: 'CYCLE_STARTED' }));
  });

  it('should transition to ACTIVE when payment is confirmed', () => {
    const sub = Subscription.create('sub-1', 'user-1', 'agr-1', 'plan-1', 30, 100);
    sub.startCycle();
    const cycleId = sub.cycles[0].id;
    sub.confirmPayment(cycleId);
    expect(sub.status).toBe('ACTIVE');
    expect(sub.cycles[0].status).toBe('PAID');
    expect(sub.getEvents()).toContainEqual(expect.objectContaining({ type: 'PAYMENT_CONFIRMED' }));
  });

  it('should allow completing a cycle with proof of service', () => {
    const sub = Subscription.create('sub-1', 'user-1', 'agr-1', 'plan-1', 30, 100);
    sub.startCycle();
    const cycleId = sub.cycles[0].id;
    sub.confirmPayment(cycleId);

    // Simulate moving to escrow (orchestrator logic)
    sub.cycles[0].markAsInEscrow();

    sub.completeCycle(cycleId, 'proof-hash-123');
    expect(sub.cycles[0].status).toBe('RELEASED');
    expect(sub.cycles[0].proofHash).toBe('proof-hash-123');
    expect(sub.getEvents()).toContainEqual(expect.objectContaining({ type: 'CYCLE_COMPLETED' }));
  });

  it('should transition to OVERDUE from PENDING_PAYMENT', () => {
    const sub = Subscription.create('sub-1', 'user-1', 'agr-1', 'plan-1', 30, 100);
    sub.startCycle();
    sub.markAsOverdue();
    expect(sub.status).toBe('OVERDUE');
  });

  it('should transition to CANCELLED from any state', () => {
    const sub = Subscription.create('sub-1', 'user-1', 'agr-1', 'plan-1', 30, 100);
    sub.cancel();
    expect(sub.status).toBe('CANCELLED');
  });

  it('should throw error when starting cycle on cancelled subscription', () => {
    const sub = Subscription.create('sub-1', 'user-1', 'agr-1', 'plan-1', 30, 100);
    sub.cancel();
    expect(() => sub.startCycle()).toThrow('Cannot start cycle on cancelled subscription');
  });

  it('should prevent starting a new cycle if the current one is not completed', () => {
    const sub = Subscription.create('sub-1', 'user-1', 'agr-1', 'plan-1', 30, 100);
    sub.startCycle();
    expect(() => sub.startCycle()).toThrow('Cannot start new cycle while current cycle is not completed');
  });
});
