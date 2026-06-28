import { DomainEvent } from '../../../../core/domain/domain-event';

export class PaymentReceivedEvent extends DomainEvent {
  static readonly type = 'PAYMENT_RECEIVED';
  constructor(aggregateId: string) {
    super(PaymentReceivedEvent.type, aggregateId);
  }
}

export class FundsLockedEvent extends DomainEvent {
  static readonly type = 'FUNDS_LOCKED';
  constructor(aggregateId: string, public readonly txHash: string) {
    super(FundsLockedEvent.type, aggregateId);
  }
}

export class ServiceProofSubmittedEvent extends DomainEvent {
  static readonly type = 'SERVICE_PROOF_SUBMITTED';
  constructor(aggregateId: string, public readonly proofHash: string) {
    super(ServiceProofSubmittedEvent.type, aggregateId);
  }
}

export class FundsReleasedEvent extends DomainEvent {
  static readonly type = 'FUNDS_RELEASED';
  constructor(aggregateId: string, public readonly txHash: string) {
    super(FundsReleasedEvent.type, aggregateId);
  }
}
