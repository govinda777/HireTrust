import { PrismaClient } from '@hiretrust/database';

export class AgreementProjection {
  constructor(private readonly prisma: PrismaClient) {}

  async handlePaymentReceived(agreementId: string): Promise<void> {
    await this.prisma.agreement.update({
      where: { id: agreementId },
      data: { status: 'ACTIVE' }
    });
  }

  async handleServiceProofSubmitted(agreementId: string, proofHash: string): Promise<void> {
    await this.prisma.agreement.update({
      where: { id: agreementId },
      data: {
        status: 'COMPLETED',
        proofHash: proofHash
      }
    });
  }
}
