import { PrismaClient } from '@hiretrust/database';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { SlaPolicy } from '@hiretrust/shared/modules/sla/domain/model/sla-policy';

export class OracleService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly messaging: RabbitMQAdapter
  ) {}

  async startMonitoring(): Promise<void> {
    console.log('Oracle Service started monitoring...');
    // In a real scenario, this would be a cron job or a loop
    // For demonstration, we simulate metric capture when requested or periodically
  }

  async captureCurrentMetrics(agreementId: string, cycleId: string): Promise<void> {
    const policyData = await this.prisma.slaPolicy.findUnique({
      where: { agreementId }
    });

    if (!policyData) return;

    const policy = new SlaPolicy(policyData.id, policyData.agreementId, {
      minUptime: policyData.minUptime,
      maxResponseTime: policyData.maxResponseTime,
      minSuccessRate: policyData.minSuccessRate
    });

    // Simulate metric retrieval from external source
    const uptime = 99.9 + Math.random() * 0.1;
    const responseTime = 150 + Math.random() * 50;
    const successRate = 99.5 + Math.random() * 0.5;

    policy.captureMetric(cycleId, 'UPTIME', uptime);
    policy.captureMetric(cycleId, 'RESPONSE_TIME', responseTime);
    policy.captureMetric(cycleId, 'SUCCESS_RATE', successRate);

    // Persist and Publish
    for (const event of policy.getEvents()) {
      await this.messaging.publish('domain_events', `sla.${event.type}`, event);
    }
    policy.clearEvents();
  }

  async validateBillingCycle(agreementId: string, cycleId: string): Promise<void> {
    console.log(`Oracle validating cycle ${cycleId} for agreement ${agreementId}...`);

    const policyData = await this.prisma.slaPolicy.findUnique({
      where: { agreementId }
    });

    if (!policyData) {
      console.error(`No SLA Policy found for agreement ${agreementId}`);
      return;
    }

    // Load metrics from DB to recreate state (simulated aggregate load)
    const metrics = await this.prisma.slaMetric.findMany({
      where: { cycleId }
    });

    const policy = new SlaPolicy(policyData.id, policyData.agreementId, {
      minUptime: policyData.minUptime,
      maxResponseTime: policyData.maxResponseTime,
      minSuccessRate: policyData.minSuccessRate
    });

    // Replay metrics to recreate state
    for (const m of metrics) {
      policy.captureMetric(m.cycleId, m.type as any, m.value);
    }
    policy.clearEvents();

    // Perform validation
    policy.validateCycle(cycleId);

    // Publish results
    for (const event of policy.getEvents()) {
      await this.messaging.publish('domain_events', `sla.${event.type}`, event);
    }
    policy.clearEvents();
  }
}
