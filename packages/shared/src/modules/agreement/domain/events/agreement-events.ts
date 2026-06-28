import { IEvent } from '../../../../core/domain/base-event';

export const AGREEMENT_CREATED = 'AGREEMENT_CREATED';
export const AGREEMENT_SIGNED = 'AGREEMENT_SIGNED';
export const PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED';
export const ESCROW_FUNDED = 'ESCROW_FUNDED';

export interface AgreementCreatedEvent extends IEvent {
  type: typeof AGREEMENT_CREATED;
  data: {
    agreementId: string;
    providerId: string;
    subscriberId: string;
    termsHash: string;
    price: number;
  };
}

export interface AgreementSignedEvent extends IEvent {
  type: typeof AGREEMENT_SIGNED;
  data: {
    agreementId: string;
    subscriberId: string;
  };
}
