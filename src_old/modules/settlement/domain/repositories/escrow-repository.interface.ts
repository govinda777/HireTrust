export interface IEscrowRepository {
  lockFunds(agreementId: string, amount: number): Promise<string>;
  releaseFunds(agreementId: string, amount: number, proof: any): Promise<string>;
  refund(agreementId: string, amount: number): Promise<string>;
}
