import { NextRequest, NextResponse } from 'next/server';
import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { PrismaClient } from '@hiretrust/database';
import { ConfirmPaymentCommand } from '@/application/commands/confirm-payment.command';
import { ConfirmPaymentHandler } from '@/application/handlers/confirm-payment.handler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscriptionId, cycleId, status } = body;

    if (status !== 'PAID') {
      return NextResponse.json({ message: 'Status not paid' }, { status: 400 });
    }

    const messaging = new RabbitMQAdapter(process.env.RABBITMQ_URL || 'amqp://localhost');
    const prisma = new PrismaClient();
    const handler = new ConfirmPaymentHandler(messaging, prisma);

    const command = new ConfirmPaymentCommand(subscriptionId, cycleId);
    await handler.handle(command);

    return NextResponse.json({ message: 'Payment confirmed and event published' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
