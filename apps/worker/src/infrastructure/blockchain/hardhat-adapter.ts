import { ethers } from 'ethers';

export class HardhatAdapter {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor(
    rpcUrl: string,
    privateKey: string,
    contractAddress: string,
    abi: any
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
  }

  async registerAgreement(
    agreementId: string,
    providerAddress: string,
    termsHash: string
  ): Promise<string> {
    const tx = await this.contract.registerAgreement(
      agreementId,
      providerAddress,
      termsHash
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }
}
