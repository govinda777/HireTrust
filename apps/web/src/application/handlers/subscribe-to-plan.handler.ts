import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { SubscribeToPlanCommand } from '../commands/subscribe-to-plan.command';
import { PrismaClient } from '@hiretrust/database';

export class SubscribeToPlanHandler {
  constructor(
    private readonly messaging: RabbitMQAdapter,
    private readonly prisma: PrismaClient
  ) {}

  async handle(command: SubscribeToPlanCommand): Promise<void> {
    // 1. Record event in Event Store (Write Model)
    await this.prisma.event.create({
      data: {
        type: 'SUBSCRIPTION_CREATED',
        aggregateType: 'Subscription',
        aggregateId: command.subscriptionId,
        data: {
          subscriberId: command.subscriberId,
          agreementId: command.agreementId,
          planId: command.planId,
          intervalInDays: command.intervalInDays,
          price: command.price
        }
      }
    });

    // 2. Publish to Event Bus
    await this.messaging.connect();
    await this.messaging.publish('domain_events', 'subscription.CREATED', {
      type: 'SUBSCRIPTION_CREATED',
      aggregateId: command.subscriptionId,
      ...command,
      occurredAt: new Date()
    });
    await this.messaging.close();
  }
}
