import { NextResponse } from 'next/server';
import { SubmitServiceProofHandler } from '../../../../application/handlers/submit-service-proof.handler';
import { SubmitServiceProofCommand } from '../../../../application/commands/submit-service-proof.command';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';

export async function POST(req: Request) {
  const { agreementId, proofHash } = await req.json();

  const amqpUrl = process.env.RABBITMQ_URL;
  if (!amqpUrl) return NextResponse.json({ error: 'RABBITMQ_URL not defined' }, { status: 500 });

  const messaging = new RabbitMQAdapter(amqpUrl);
  const handler = new SubmitServiceProofHandler(messaging);

  try {
    await handler.handle(new SubmitServiceProofCommand(agreementId, proofHash));
    return NextResponse.json({ message: 'Proof submitted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit proof' }, { status: 500 });
  }
}
