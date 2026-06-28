import { Entity } from '../../../../core/domain/entity';

export interface AgreementProps {
  providerId: string;
  subscriberId: string;
  termsHash: string;
  price: number;
  status: 'PENDING' | 'SIGNED' | 'ACTIVE' | 'CANCELLED';
  onChainHash?: string;
}

export class Agreement extends Entity<AgreementProps> {
  private constructor(props: AgreementProps, id?: string) {
    super(props, id);
  }

  public static create(props: AgreementProps, id?: string): Agreement {
    return new Agreement(props, id);
  }

  public sign(subscriberId: string) {
    if (this.props.subscriberId !== subscriberId) {
      throw new Error('Unauthorized subscriber');
    }
    this.props.status = 'SIGNED';
  }

  public activate(onChainHash: string) {
    this.props.status = 'ACTIVE';
    this.props.onChainHash = onChainHash;
  }
}
