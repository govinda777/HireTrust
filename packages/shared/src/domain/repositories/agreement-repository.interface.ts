export interface IAgreementRepository {
  save(agreement: any): Promise<void>;
  findById(id: string): Promise<any>;
  findBySubscriberId(subscriberId: string): Promise<any[]>;
}
