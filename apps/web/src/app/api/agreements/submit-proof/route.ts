import { NextResponse } from 'next/server';
import { SubmitServiceProofHandler, SubmitServiceProofCommand } from '../../../../application/use-cases/submit-service-proof';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';

export async function POST(req: Request) {
  const { agreementId, proofHash } = await req.json();

  const amqpUrl = process.env.RABBITMQ_URL || 'amqp://local_user:local_password@localhost:5672';
  const messaging = new RabbitMQAdapter(amqpUrl);
  const handler = new SubmitServiceProofHandler(messaging);

  try {
    await handler.handle(new SubmitServiceProofCommand(agreementId, proofHash));
    return NextResponse.json({ message: 'Proof submitted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit proof' }, { status: 500 });
  }
}
