import starkbank from 'starkbank';

export class StarkBankAdapter {
  private initialized = false;

  constructor(private projectId: string, private privateKey: string, private environment: 'sandbox' | 'production') {
    if (this.projectId !== 'dummy-project-id' && this.privateKey !== 'dummy-private-key') {
      const user = new starkbank.Project({
        id: this.projectId,
        privateKey: this.privateKey,
        environment: this.environment
      });
      starkbank.user = user;
      this.initialized = true;
    }
  }

  async createPixRequest(amount: number, metadata: any) {
    if (!this.initialized) {
      console.warn('Stark Bank not initialized with real keys. Returning mock PIX data.');
      return {
        id: 'mock-pix-id',
        amount: amount,
        brcode: '00020101021226850014br.gov.bcb.pix0123mock-pix-qr-code',
        status: 'created',
        metadata
      };
    }

    const invoices = await starkbank.invoice.create([
      new starkbank.Invoice({
        amount: amount,
        taxId: '00.000.000/0001-00',
        name: 'HireTrust Subscriber',
        tags: [metadata.agreementId]
      })
    ]);
    return invoices[0];
  }
}
