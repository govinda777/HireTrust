import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { AgreementProjection } from './projections/agreement-projection';
import { EscrowOrchestrator } from './orchestrators/escrow-orchestrator';
import { HardhatAdapter } from './infrastructure/blockchain/hardhat-adapter';
import { PrismaClient } from '@hiretrust/database';

async function bootstrap() {
  const amqpUrl = process.env.RABBITMQ_URL;
  if (!amqpUrl) {
    throw new Error('RABBITMQ_URL must be defined');
  }

  const messaging = new RabbitMQAdapter(amqpUrl);
  const prisma = new PrismaClient();
  const blockchain = new HardhatAdapter();

  const projection = new AgreementProjection(prisma);
  const orchestrator = new EscrowOrchestrator(blockchain, messaging);

  try {
    await messaging.connect();
    console.log('Worker connected to RabbitMQ');

    // Projections
    await messaging.subscribe('domain_events', 'worker_projections', 'agreement.PAYMENT_RECEIVED', async (event) => {
      await projection.handlePaymentReceived(event.aggregateId);
    });

    await messaging.subscribe('domain_events', 'worker_projections', 'agreement.SERVICE_PROOF_SUBMITTED', async (event) => {
      await projection.handleServiceProofSubmitted(event.aggregateId, event.proofHash);
    });

    // Orchestrators (Effects)
    await messaging.subscribe('domain_events', 'worker_orchestrators', 'agreement.PAYMENT_RECEIVED', async (event) => {
      await orchestrator.onPaymentReceived(event);
    });

  } catch (error) {
    console.error('Worker failed to start:', error);
    process.exit(1);
  }
}

bootstrap();
