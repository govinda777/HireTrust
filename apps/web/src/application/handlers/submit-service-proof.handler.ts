import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';
import { SubmitServiceProofCommand } from '../commands/submit-service-proof.command';

export class SubmitServiceProofHandler {
  constructor(private readonly messaging: RabbitMQAdapter) {}

  async handle(command: SubmitServiceProofCommand): Promise<void> {
    await this.messaging.connect();
    await this.messaging.publish('domain_events', 'agreement.SERVICE_PROOF_SUBMITTED', {
      type: 'SERVICE_PROOF_SUBMITTED',
      aggregateId: command.agreementId,
      proofHash: command.proofHash,
      occurredAt: new Date()
    });
    await this.messaging.close();
  }
}
