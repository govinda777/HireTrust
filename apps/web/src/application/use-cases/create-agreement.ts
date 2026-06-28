import { Agreement, AGREEMENT_CREATED, AgreementCreatedEvent } from '@hiretrust/shared';
import { PrismaEventStore } from '@hiretrust/database';
import { RabbitMQPublisher } from '../../infrastructure/messaging/rabbitmq-publisher';

export interface CreateAgreementCommand {
  providerId: string;
  subscriberId: string;
  termsHash: string;
  price: number;
}

export class CreateAgreementHandler {
  constructor(
    private eventStore: PrismaEventStore,
    private publisher: RabbitMQPublisher
  ) {}

  async execute(command: CreateAgreementCommand): Promise<string> {
    const agreementId = crypto.randomUUID();

    const event: AgreementCreatedEvent = {
      type: AGREEMENT_CREATED,
      occurredAt: new Date(),
      data: {
        agreementId,
        ...command
      }
    };

    await this.eventStore.save(event);
    await this.publisher.publish(event);

    return agreementId;
  }
}
