import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitServiceProofHandler, SubmitServiceProofCommand } from './submit-service-proof';

describe('SubmitServiceProofHandler', () => {
  let messaging: any;
  let handler: SubmitServiceProofHandler;

  beforeEach(() => {
    messaging = {
      connect: vi.fn().mockResolvedValue({}),
      publish: vi.fn().mockResolvedValue({}),
      close: vi.fn().mockResolvedValue({}),
    };
    handler = new SubmitServiceProofHandler(messaging);
  });

  it('should publish SERVICE_PROOF_SUBMITTED event', async () => {
    const command = new SubmitServiceProofCommand('agg-1', 'hash-123');
    await handler.handle(command);

    expect(messaging.connect).toHaveBeenCalled();
    expect(messaging.publish).toHaveBeenCalledWith(
      'domain_events',
      'agreement.SERVICE_PROOF_SUBMITTED',
      expect.objectContaining({
        type: 'SERVICE_PROOF_SUBMITTED',
        aggregateId: 'agg-1',
        proofHash: 'hash-123'
      })
    );
    expect(messaging.close).toHaveBeenCalled();
  });
});
