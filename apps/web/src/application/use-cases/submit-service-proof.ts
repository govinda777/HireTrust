import { RabbitMQAdapter } from '@hiretrust/shared/infrastructure/messaging/rabbitmq-adapter';

export class SubmitServiceProofCommand {
  constructor(
    public readonly agreementId: string,
    public readonly proofHash: string
  ) {}
}

export class SubmitServiceProofHandler {
  constructor(private readonly messaging: RabbitMQAdapter) {}

  async handle(command: SubmitServiceProofCommand): Promise<void> {
    // In a real CQRS/ES system, we would:
    // 1. Load the Aggregate from Event Store
    // 2. Validate state (isActive?)
    // 3. Apply event
    // 4. Save to Event Store

    // For this Layer 2 simulation, we publish the event directly
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
