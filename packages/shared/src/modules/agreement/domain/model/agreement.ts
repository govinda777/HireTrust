import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import {
  ServiceProofSubmittedEvent,
  PaymentReceivedEvent
} from '../events/agreement-events';

export type AgreementStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export class Agreement extends AggregateRoot {
  private _status: AgreementStatus;
  private _proofHash?: string;

  constructor(id: string, status: AgreementStatus = 'PENDING') {
    super(id);
    this._status = status;
  }

  public get status(): AgreementStatus {
    return this._status;
  }

  public receivePayment(): void {
    if (this._status !== 'PENDING') {
      throw new Error('Agreement is not in PENDING state');
    }
    this._status = 'ACTIVE';
    this.apply(new PaymentReceivedEvent(this.id));
  }

  public submitProof(proofHash: string): void {
    if (this._status !== 'ACTIVE') {
      throw new Error('Agreement is not ACTIVE');
    }
    this._proofHash = proofHash;
    this._status = 'COMPLETED';
    this.apply(new ServiceProofSubmittedEvent(this.id, proofHash));
  }

  public get proofHash(): string | undefined {
    return this._proofHash;
  }
}
