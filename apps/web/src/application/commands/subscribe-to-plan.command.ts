export class SubscribeToPlanCommand {
  constructor(
    public readonly subscriptionId: string,
    public readonly subscriberId: string,
    public readonly agreementId: string,
    public readonly planId: string,
    public readonly intervalInDays: number,
    public readonly price: number
  ) {}
}
