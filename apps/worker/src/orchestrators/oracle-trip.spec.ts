import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingOrchestrator } from './billing-orchestrator';
import { OracleService } from '../application/sla/oracle-service';
import { BlockchainProvider } from '../application/ports/blockchain-provider.interface';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { PrismaClient } from '@hiretrust/database';

describe('Oracle Trip Integration Simulation', () => {
  let billingOrchestrator: BillingOrchestrator;
  let oracleService: OracleService;
  let mockBlockchain: BlockchainProvider;
  let mockMessaging: RabbitMQAdapter;
  let mockPrisma: any;

  beforeEach(() => {
    mockBlockchain = {
      lockFunds: vi.fn().mockResolvedValue('0x-lock-tx'),
      releaseFunds: vi.fn().mockResolvedValue('0x-release-tx'),
    };
    mockMessaging = {
      publish: vi.fn().mockResolvedValue(undefined),
    } as any;
    mockPrisma = {
      slaPolicy: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'policy-1',
          agreementId: 'agr-1',
          minUptime: 99,
          maxResponseTime: 500,
          minSuccessRate: 95
        }),
      },
      slaMetric: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      subscription: {
        findUnique: vi.fn().mockResolvedValue({ id: 'sub-1', agreementId: 'agr-1', price: 0.1 }),
      }
    };

    billingOrchestrator = new BillingOrchestrator(mockBlockchain, mockMessaging, mockPrisma as any);
    oracleService = new OracleService(mockPrisma as any, mockMessaging);
  });

  it('should complete the full oracle trip: Data -> Validation -> Settlement', async () => {
    const cycleId = 'sub-1_cycle1';
    const agreementId = 'agr-1';

    // 1. Oracle Captures Metrics
    await oracleService.captureCurrentMetrics(agreementId, cycleId);
    expect(mockMessaging.publish).toHaveBeenCalledWith('domain_events', expect.stringContaining('sla.SLA_METRIC_CAPTURED'), expect.anything());

    // 2. Oracle Validates Cycle
    // We clear mock to check next calls
    (mockMessaging.publish as any).mockClear();
    await oracleService.validateBillingCycle(agreementId, cycleId);

    // Check if SLA_VALIDATED was published
    expect(mockMessaging.publish).toHaveBeenCalledWith('domain_events', 'sla.SLA_VALIDATED', expect.objectContaining({
      cycleId,
      type: 'SLA_VALIDATED'
    }));

    const validationEvent = (mockMessaging.publish as any).mock.calls.find((call: any) => call[1] === 'sla.SLA_VALIDATED')[2];
    const proofHash = validationEvent.proofHash;

    // 3. Orchestrator processes SLA_VALIDATED and releases funds
    await billingOrchestrator.onSlaValidated(validationEvent);

    expect(mockBlockchain.releaseFunds).toHaveBeenCalledWith(cycleId, proofHash);
    expect(mockMessaging.publish).toHaveBeenCalledWith('domain_events', 'subscription.CYCLE_COMPLETED', expect.objectContaining({
      cycleId,
      proofHash,
      txHash: '0x-release-tx'
    }));
  });

  it('should handle SLA violations by marking cycle as DISPUTED', async () => {
    const cycleId = 'sub-1_cycle2';
    const agreementId = 'agr-1';

    // Simulate poor metrics by mocking findMany for validation
    mockPrisma.slaMetric.findMany.mockResolvedValue([
      { cycleId, type: 'UPTIME', value: 50 } // Massive violation
    ]);

    await oracleService.validateBillingCycle(agreementId, cycleId);

    expect(mockMessaging.publish).toHaveBeenCalledWith('domain_events', 'sla.SLA_VIOLATED', expect.objectContaining({
      cycleId,
      type: 'SLA_VIOLATED'
    }));

    const violationEvent = (mockMessaging.publish as any).mock.calls.find((call: any) => call[1] === 'sla.SLA_VIOLATED')[2];

    await billingOrchestrator.onSlaViolated(violationEvent);

    expect(mockBlockchain.releaseFunds).not.toHaveBeenCalled();
    expect(mockMessaging.publish).toHaveBeenCalledWith('domain_events', 'subscription.CYCLE_DISPUTED', expect.objectContaining({
      cycleId,
      type: 'CYCLE_DISPUTED'
    }));
  });
});
