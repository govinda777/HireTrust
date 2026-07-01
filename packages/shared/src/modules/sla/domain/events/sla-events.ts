import { DomainEvent } from '../../../../core/domain/domain-event';

export class SlaMetricCapturedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly cycleId: string,
    public readonly metricType: string,
    public readonly value: number,
    public readonly timestamp: Date
  ) {
    super('SLA_METRIC_CAPTURED', aggregateId);
  }
}

export class SlaViolatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly cycleId: string,
    public readonly reason: string,
    public readonly metrics: any
  ) {
    super('SLA_VIOLATED', aggregateId);
  }
}

export class SlaValidatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly cycleId: string,
    public readonly proofHash: string,
    public readonly metrics: any
  ) {
    super('SLA_VALIDATED', aggregateId);
  }
}
