export type BillingCycleStatus = 'PENDING' | 'PAID' | 'IN_ESCROW' | 'RELEASED' | 'REFUNDED';

export class BillingCycle {
  constructor(
    public readonly id: string,
    public readonly cycleNumber: number,
    public readonly dueDate: Date,
    private _status: BillingCycleStatus = 'PENDING',
    private _paymentDate?: Date,
    private _proofHash?: string
  ) {}

  public get status(): BillingCycleStatus {
    return this._status;
  }

  public get paymentDate(): Date | undefined {
    return this._paymentDate;
  }

  public get proofHash(): string | undefined {
    return this._proofHash;
  }

  public confirmPayment(date: Date): void {
    if (this._status !== 'PENDING') {
      throw new Error('Cycle is not PENDING');
    }
    this._status = 'PAID';
    this._paymentDate = date;
  }

  public markAsInEscrow(): void {
    if (this._status !== 'PAID') {
      throw new Error('Cycle must be PAID to move to ESCROW');
    }
    this._status = 'IN_ESCROW';
  }

  public complete(proofHash: string): void {
    if (this._status !== 'IN_ESCROW') {
      throw new Error('Cycle must be IN_ESCROW to be completed');
    }
    this._proofHash = proofHash;
    this._status = 'RELEASED';
  }
}
