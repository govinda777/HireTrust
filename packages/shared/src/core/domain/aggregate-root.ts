import { DomainEvent } from './domain-event';

export abstract class AggregateRoot {
  private _events: DomainEvent[] = [];

  constructor(public readonly id: string) {}

  protected apply(event: DomainEvent): void {
    this._events.push(event);
  }

  public getEvents(): DomainEvent[] {
    return [...this._events];
  }

  public clearEvents(): void {
    this._events = [];
  }
}
