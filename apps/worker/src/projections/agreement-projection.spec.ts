import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgreementProjection } from './agreement-projection';

describe('AgreementProjection', () => {
  let prisma: any;
  let projection: AgreementProjection;

  beforeEach(() => {
    prisma = {
      agreement: {
        update: vi.fn().mockResolvedValue({}),
      },
    };
    projection = new AgreementProjection(prisma);
  });

  it('should update status to ACTIVE on payment received', async () => {
    await projection.handlePaymentReceived('agg-1');
    expect(prisma.agreement.update).toHaveBeenCalledWith({
      where: { id: 'agg-1' },
      data: { status: 'ACTIVE' }
    });
  });

  it('should update status to COMPLETED and set proofHash', async () => {
    await projection.handleServiceProofSubmitted('agg-1', 'hash-123');
    expect(prisma.agreement.update).toHaveBeenCalledWith({
      where: { id: 'agg-1' },
      data: {
        status: 'COMPLETED',
        proofHash: 'hash-123'
      }
    });
  });
});
