import { PrismaClient } from '@hiretrust/database';
import {
  AgreementCreatedEvent,
  AGREEMENT_CREATED,
  AgreementSignedEvent,
  AGREEMENT_SIGNED
} from '@hiretrust/shared';
import { HardhatAdapter } from '../infrastructure/blockchain/hardhat-adapter';

export class AgreementProjection {
  constructor(
    private prisma: PrismaClient,
    private blockchain: HardhatAdapter
  ) {}

  async handle(event: any) {
    console.log('Processing event:', event.type);

    switch (event.type) {
      case AGREEMENT_CREATED:
        const createdEvent = event as AgreementCreatedEvent;
        await this.prisma.agreement.create({
          data: {
            id: createdEvent.data.agreementId,
            providerId: createdEvent.data.providerId,
            subscriberId: createdEvent.data.subscriberId,
            termsHash: createdEvent.data.termsHash,
            status: 'PENDING',
          },
        });
        console.log('Agreement projection created:', createdEvent.data.agreementId);
        break;

      case AGREEMENT_SIGNED:
        const signedEvent = event as AgreementSignedEvent;

        // 1. Update Read Model status to SIGNED
        const agreement = await this.prisma.agreement.update({
          where: { id: signedEvent.data.agreementId },
          data: { status: 'SIGNED' },
        });

        // 2. Trigger Blockchain Transaction (Cartório Digital)
        console.log('Triggering On-chain Registration for:', agreement.id);
        try {
          const txHash = await this.blockchain.registerAgreement(
            agreement.id,
            agreement.providerId,
            agreement.termsHash
          );

          // 3. Update Read Model with On-chain Hash and status ACTIVE
          await this.prisma.agreement.update({
            where: { id: agreement.id },
            data: {
              onChainHash: txHash,
              status: 'ACTIVE'
            },
          });
          console.log('Agreement activated on-chain. Tx:', txHash);
        } catch (error) {
          console.error('Blockchain registration failed:', error);
          // In a real system, we would mark as FAILED or retry
        }
        break;
    }
  }
}
