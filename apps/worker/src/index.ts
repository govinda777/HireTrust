import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { AgreementProjection } from './projections/agreement-projection';
import { SubscriptionProjection } from './projections/subscription-projection';
import { EscrowOrchestrator } from './orchestrators/escrow-orchestrator';
import { BillingOrchestrator } from './orchestrators/billing-orchestrator';
import { EthersAdapter } from './infrastructure/blockchain/ethers-adapter';
import { PrismaClient } from '@hiretrust/database';
import { OracleService } from './application/sla/oracle-service';

async function bootstrap() {
  const amqpUrl = process.env.RABBITMQ_URL;
  if (!amqpUrl) {
    throw new Error('RABBITMQ_URL must be defined');
  }

  const messaging = new RabbitMQAdapter(amqpUrl);
  const prisma = new PrismaClient();
  const blockchain = new EthersAdapter();

  const agreementProjection = new AgreementProjection(prisma);
  const subscriptionProjection = new SubscriptionProjection(prisma);

  const escrowOrchestrator = new EscrowOrchestrator(blockchain, messaging);
  const billingOrchestrator = new BillingOrchestrator(blockchain, messaging, prisma);
  const oracleService = new OracleService(prisma, messaging);

  try {
    await messaging.connect();
    console.log('Worker connected to RabbitMQ');

    await oracleService.startMonitoring();

    // Agreement Projections
    await messaging.subscribe('domain_events', 'worker_projections', 'agreement.PAYMENT_RECEIVED', async (event) => {
      await agreementProjection.handlePaymentReceived(event.aggregateId);
    });

    await messaging.subscribe('domain_events', 'worker_projections', 'agreement.SERVICE_PROOF_SUBMITTED', async (event) => {
      await agreementProjection.handleServiceProofSubmitted(event.aggregateId, event.proofHash);
    });

    // Subscription Projections
    await messaging.subscribe('domain_events', 'worker_projections', 'subscription.CREATED', async (event) => {
      await subscriptionProjection.handleSubscriptionCreated(event);
    });

    await messaging.subscribe('domain_events', 'worker_projections', 'subscription.CYCLE_STARTED', async (event) => {
      await subscriptionProjection.handleCycleStarted(event);
    });

    await messaging.subscribe('domain_events', 'worker_projections', 'subscription.PAYMENT_CONFIRMED', async (event) => {
      await subscriptionProjection.handlePaymentConfirmed(event);
    });

    await messaging.subscribe('domain_events', 'worker_projections', 'subscription.FUNDS_LOCKED_IN_ESCROW', async (event) => {
      await subscriptionProjection.handleFundsLocked(event);
    });

    await messaging.subscribe('domain_events', 'worker_projections', 'subscription.CYCLE_COMPLETED', async (event) => {
      await subscriptionProjection.handleCycleCompleted(event);
    });

    // SLA Projections
    await messaging.subscribe('domain_events', 'worker_projections', 'sla.SLA_METRIC_CAPTURED', async (event) => {
      await subscriptionProjection.handleSlaMetricCaptured(event);
    });

    await messaging.subscribe('domain_events', 'worker_projections', 'sla.SLA_VALIDATED', async (event) => {
      await subscriptionProjection.handleSlaValidated(event);
    });

    await messaging.subscribe('domain_events', 'worker_projections', 'sla.SLA_VIOLATED', async (event) => {
      await subscriptionProjection.handleSlaViolated(event);
    });

    // Orchestrators (Effects)
    await messaging.subscribe('domain_events', 'worker_orchestrators', 'agreement.PAYMENT_RECEIVED', async (event) => {
      await escrowOrchestrator.onPaymentReceived(event);
    });

    await messaging.subscribe('domain_events', 'worker_orchestrators', 'subscription.PAYMENT_CONFIRMED', async (event) => {
      await billingOrchestrator.onPaymentConfirmed(event);
    });

    await messaging.subscribe('domain_events', 'worker_orchestrators', 'sla.SLA_VALIDATED', async (event) => {
      await billingOrchestrator.onSlaValidated(event);
    });

    await messaging.subscribe('domain_events', 'worker_orchestrators', 'sla.SLA_VIOLATED', async (event) => {
      await billingOrchestrator.onSlaViolated(event);
    });

    // Oracle triggers (simulating cycle end trigger)
    await messaging.subscribe('domain_events', 'worker_oracle', 'subscription.CYCLE_STARTED', async (event) => {
      // In a real scenario, we would wait for the period. Here we trigger monitoring immediately for demo.
      const sub = await prisma.subscription.findUnique({ where: { id: event.aggregateId } });
      if (sub) {
        await oracleService.captureCurrentMetrics(sub.agreementId, event.cycleId);
        // Simulate validation after some time
        setTimeout(() => oracleService.validateBillingCycle(sub.agreementId, event.cycleId), 5000);
      }
    });

  } catch (error) {
    console.error('Worker failed to start:', error);
    process.exit(1);
  }
}

bootstrap();
