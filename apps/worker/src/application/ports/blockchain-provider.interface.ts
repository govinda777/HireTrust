export interface BlockchainProvider {
  lockFunds(agreementId: string, providerAddress: string, amountEth: string): Promise<string>;
}
