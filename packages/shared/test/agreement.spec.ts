import { describe, it, expect } from 'vitest';
import { Agreement } from '../src/modules/agreement/domain/model/agreement';

describe('Agreement Aggregate', () => {
  it('should create an agreement with PENDING status', () => {
    const agreement = Agreement.create({
      providerId: 'provider-1',
      subscriberId: 'subscriber-1',
      termsHash: 'hash-1',
      price: 100,
      status: 'PENDING'
    });

    expect(agreement.props.status).toBe('PENDING');
    expect(agreement.id).toBeDefined();
  });

  it('should change status to SIGNED when signed by correct subscriber', () => {
    const agreement = Agreement.create({
      providerId: 'provider-1',
      subscriberId: 'subscriber-1',
      termsHash: 'hash-1',
      price: 100,
      status: 'PENDING'
    });

    agreement.sign('subscriber-1');
    expect(agreement.props.status).toBe('SIGNED');
  });
});
