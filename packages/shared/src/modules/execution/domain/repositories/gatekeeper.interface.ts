export interface IResourceGatekeeper {
  grantAccess(agreementId: string, metadata: any): Promise<{ accessKey: string }>;
  revokeAccess(agreementId: string): Promise<void>;
  checkUsage(agreementId: string): Promise<any>;
}
