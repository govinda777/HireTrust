import express from 'express';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';

const router = express.Router();
const amqpUrl = process.env.RABBITMQ_URL || 'amqp://local_user:local_password@localhost:5672';
const adapter = new RabbitMQAdapter(amqpUrl);

router.post('/simulate-pix', async (req, res) => {
  const { agreementId } = req.body;

  if (!agreementId) return res.status(400).json({ error: 'agreementId is required' });

  try {
    await adapter.connect();
    await adapter.publish('domain_events', 'agreement.PAYMENT_RECEIVED', {
      type: 'PAYMENT_RECEIVED',
      aggregateId: agreementId,
      occurredAt: new Date()
    });
    await adapter.close();

    res.json({ message: 'PIX simulated for agreement: ' + agreementId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to simulate PIX' });
  }
});

export default router;
