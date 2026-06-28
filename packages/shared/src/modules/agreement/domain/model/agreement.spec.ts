import { describe, it, expect } from 'vitest';
import { Agreement } from './agreement';
import { ServiceProofSubmittedEvent, PaymentReceivedEvent } from '../events/agreement-events';

describe('Agreement Aggregate', () => {
  it('should activate agreement when payment is received', () => {
    const agreement = new Agreement('agreement-1');
    agreement.receivePayment();

    expect(agreement.status).toBe('ACTIVE');
    const events = agreement.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PaymentReceivedEvent);
  });

  it('should complete agreement when proof is submitted', () => {
    const agreement = new Agreement('agreement-1', 'ACTIVE');
    const proofHash = 'hash-123';
    agreement.submitProof(proofHash);

    expect(agreement.status).toBe('COMPLETED');
    expect(agreement.proofHash).toBe(proofHash);
    const events = agreement.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ServiceProofSubmittedEvent);
    expect((events[0] as ServiceProofSubmittedEvent).proofHash).toBe(proofHash);
  });

  it('should throw error if submitting proof for non-active agreement', () => {
    const agreement = new Agreement('agreement-1', 'PENDING');
    expect(() => agreement.submitProof('hash')).toThrow('Agreement is not ACTIVE');
  });
});
