import { AGREEMENT_SIGNED } from '@hiretrust/shared';
import { StarkBankAdapter } from '../../infrastructure/adapters/starkbank-adapter';

export interface RequestPaymentCommand {
  agreementId: string;
  amount: number;
}

export class RequestPaymentHandler {
  constructor(private starkbank: StarkBankAdapter) {}

  async execute(command: RequestPaymentCommand) {
    // In a real flow, this would be triggered by AGREEMENT_SIGNED event
    // But for v0.2 preview, we provide an endpoint
    return await this.starkbank.createPixRequest(command.amount, { agreementId: command.agreementId });
  }
}
