export class ConfirmPaymentCommand {
  constructor(
    public readonly subscriptionId: string,
    public readonly cycleId: string
  ) {}
}
