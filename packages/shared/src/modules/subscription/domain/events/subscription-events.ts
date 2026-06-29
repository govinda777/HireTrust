import { DomainEvent } from '../../../../core/domain/domain-event';

export class SubscriptionCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly subscriberId: string,
    public readonly agreementId: string,
    public readonly planId: string,
    public readonly intervalInDays: number,
    public readonly price: number
  ) {
    super('SUBSCRIPTION_CREATED', aggregateId);
  }
}

export class CycleStartedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly cycleNumber: number,
    public readonly cycleId: string,
    public readonly dueDate: Date
  ) {
    super('CYCLE_STARTED', aggregateId);
  }
}

export class PaymentConfirmedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly cycleId: string,
    public readonly paymentDate: Date
  ) {
    super('PAYMENT_CONFIRMED', aggregateId);
  }
}

export class CycleCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly cycleId: string,
    public readonly proofHash: string,
    public readonly completionDate: Date
  ) {
    super('CYCLE_COMPLETED', aggregateId);
  }
}

export class SubscriptionOverdueEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super('SUBSCRIPTION_OVERDUE', aggregateId);
  }
}

export class SubscriptionCancelledEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super('SUBSCRIPTION_CANCELLED', aggregateId);
  }
}
