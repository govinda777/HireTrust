import { NextResponse } from 'next/server';
import { PrismaClient } from '@hiretrust/database';
import { PrismaEventStore } from '@hiretrust/database';
import { RabbitMQPublisher } from '../../../infrastructure/messaging/rabbitmq-publisher';
import { CreateAgreementHandler } from '../../../application/use-cases/create-agreement';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const eventStore = new PrismaEventStore(prisma);
const publisher = new RabbitMQPublisher(process.env.RABBITMQ_URL || 'amqp://local_user:local_password@localhost:5672');

let publisherConnected = false;

export async function POST(req: Request) {
  if (!publisherConnected) {
    try {
        await publisher.connect();
        publisherConnected = true;
    } catch (e) {
        console.error('RabbitMQ connection failed, continuing without publisher for build');
    }
  }

  const body = await req.json();
  const handler = new CreateAgreementHandler(eventStore, publisher);

  try {
    const agreementId = await handler.execute(body);
    return NextResponse.json({ agreementId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
