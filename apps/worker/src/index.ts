import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { AgreementProjection } from './projections/agreement-projection';
import { EscrowOrchestrator } from './orchestrators/escrow-orchestrator';
import { HardhatAdapter } from './infrastructure/blockchain/hardhat-adapter';
import { PrismaClient } from '@hiretrust/database';
import express from 'express';
import pixSimulator from './api/pix-simulator';

async function bootstrap() {
  const amqpUrl = process.env.RABBITMQ_URL || 'amqp://local_user:local_password@localhost:5672';
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

    // API for Simulator
    const app = express();
    app.use(express.json());
    app.use('/api', pixSimulator);
    app.listen(3001, () => console.log('Simulator API on port 3001'));

  } catch (error) {
    console.error('Worker failed to start:', error);
  }
}

bootstrap();
