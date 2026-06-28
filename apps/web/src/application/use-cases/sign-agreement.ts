import { AGREEMENT_SIGNED, AgreementSignedEvent } from '@hiretrust/shared';
import { PrismaEventStore } from '@hiretrust/database';
import { RabbitMQPublisher } from '../../infrastructure/messaging/rabbitmq-publisher';

export interface SignAgreementCommand {
  agreementId: string;
  subscriberId: string;
}

export class SignAgreementHandler {
  constructor(
    private eventStore: PrismaEventStore,
    private publisher: RabbitMQPublisher
  ) {}

  async execute(command: SignAgreementCommand): Promise<void> {
    const event: AgreementSignedEvent = {
      type: AGREEMENT_SIGNED,
      occurredAt: new Date(),
      data: {
        agreementId: command.agreementId,
        subscriberId: command.subscriberId
      }
    };

    await this.eventStore.save(event);
    await this.publisher.publish(event);
  }
}
