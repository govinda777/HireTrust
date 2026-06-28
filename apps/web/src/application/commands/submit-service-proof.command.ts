export class SubmitServiceProofCommand {
  constructor(
    public readonly agreementId: string,
    public readonly proofHash: string
  ) {}
}
