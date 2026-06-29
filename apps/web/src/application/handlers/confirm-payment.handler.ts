import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { ConfirmPaymentCommand } from '../commands/confirm-payment.command';
import { PrismaClient } from '@hiretrust/database';

export class ConfirmPaymentHandler {
  constructor(
    private readonly messaging: RabbitMQAdapter,
    private readonly prisma: PrismaClient
  ) {}

  async handle(command: ConfirmPaymentCommand): Promise<void> {
    await this.prisma.event.create({
      data: {
        type: 'PAYMENT_CONFIRMED',
        aggregateType: 'Subscription',
        aggregateId: command.subscriptionId,
        data: {
          cycleId: command.cycleId
        }
      }
    });

    await this.messaging.connect();
    await this.messaging.publish('domain_events', 'subscription.PAYMENT_CONFIRMED', {
      type: 'PAYMENT_CONFIRMED',
      aggregateId: command.subscriptionId,
      cycleId: command.cycleId,
      occurredAt: new Date()
    });
    await this.messaging.close();
  }
}
