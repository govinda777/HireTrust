import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import { BillingCycle } from './billing-cycle';
import {
  SubscriptionCreatedEvent,
  CycleStartedEvent,
  PaymentConfirmedEvent,
  CycleCompletedEvent,
  SubscriptionCancelledEvent,
  SubscriptionOverdueEvent
} from '../events/subscription-events';

export type SubscriptionStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'ACTIVE' | 'OVERDUE' | 'CANCELLED';

export class Subscription extends AggregateRoot {
  private _subscriberId: string;
  private _agreementId: string;
  private _planId: string;
  private _intervalInDays: number;
  private _price: number;
  private _status: SubscriptionStatus;
  private _cycles: BillingCycle[] = [];

  constructor(
    id: string,
    subscriberId: string,
    agreementId: string,
    planId: string,
    intervalInDays: number,
    price: number,
    status: SubscriptionStatus = 'DRAFT'
  ) {
    super(id);
    this._subscriberId = subscriberId;
    this._agreementId = agreementId;
    this._planId = planId;
    this._intervalInDays = intervalInDays;
    this._price = price;
    this._status = status;
  }

  public static create(
    id: string,
    subscriberId: string,
    agreementId: string,
    planId: string,
    intervalInDays: number,
    price: number
  ): Subscription {
    const subscription = new Subscription(id, subscriberId, agreementId, planId, intervalInDays, price, 'DRAFT');
    subscription.apply(
      new SubscriptionCreatedEvent(id, subscriberId, agreementId, planId, intervalInDays, price)
    );
    return subscription;
  }

  public get status(): SubscriptionStatus {
    return this._status;
  }

  public get subscriberId(): string {
    return this._subscriberId;
  }

  public get agreementId(): string {
    return this._agreementId;
  }

  public get price(): number {
    return this._price;
  }

  public get cycles(): BillingCycle[] {
    return [...this._cycles];
  }

  public startCycle(): void {
    if (this._status === 'CANCELLED') {
      throw new Error('Cannot start cycle on cancelled subscription');
    }

    if (this._cycles.length > 0) {
      const lastCycle = this._cycles[this._cycles.length - 1];
      if (lastCycle.status !== 'RELEASED' && lastCycle.status !== 'REFUNDED') {
        throw new Error('Cannot start new cycle while current cycle is not completed');
      }
    }

    const cycleNumber = this._cycles.length + 1;
    const cycleId = `${this.id}_cycle${cycleNumber}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + this._intervalInDays);

    const cycle = new BillingCycle(cycleId, cycleNumber, dueDate);
    this._cycles.push(cycle);
    this._status = 'PENDING_PAYMENT';

    this.apply(new CycleStartedEvent(this.id, cycleNumber, cycleId, dueDate));
  }

  public confirmPayment(cycleId: string): void {
    const cycle = this._cycles.find((c) => c.id === cycleId);
    if (!cycle) {
      throw new Error('Cycle not found');
    }

    cycle.confirmPayment(new Date());
    this._status = 'ACTIVE';

    this.apply(new PaymentConfirmedEvent(this.id, cycleId, cycle.paymentDate!));
  }

  public completeCycle(cycleId: string, proofHash: string): void {
    const cycle = this._cycles.find((c) => c.id === cycleId);
    if (!cycle) {
      throw new Error('Cycle not found');
    }

    cycle.complete(proofHash);

    this.apply(new CycleCompletedEvent(this.id, cycleId, proofHash, new Date()));
  }

  public markAsOverdue(): void {
    if (this._status !== 'PENDING_PAYMENT') {
      throw new Error('Only pending payment subscriptions can become overdue');
    }
    this._status = 'OVERDUE';
    this.apply(new SubscriptionOverdueEvent(this.id));
  }

  public cancel(): void {
    this._status = 'CANCELLED';
    this.apply(new SubscriptionCancelledEvent(this.id));
  }
}
