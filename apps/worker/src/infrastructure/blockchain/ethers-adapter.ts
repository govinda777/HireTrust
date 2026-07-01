import { ethers } from 'ethers';
import EscrowEngineArtifact from '@blockchain/artifacts/contracts/EscrowEngine.sol/EscrowEngine.json';
import { BlockchainProvider } from '../../application/ports/blockchain-provider.interface';

export class EthersAdapter implements BlockchainProvider {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private escrowContract: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || process.env.HARDHAT_RPC_URL || 'http://localhost:8545';
    const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    const contractAddress = process.env.ESCROW_ENGINE_ADDRESS || '';
    this.escrowContract = new ethers.Contract(contractAddress, (EscrowEngineArtifact as any).abi, this.wallet);
  }

  async lockFunds(agreementId: string, providerAddress: string, amountEth: string): Promise<string> {
    const tx = await this.escrowContract.lockFunds(agreementId, providerAddress, {
      value: ethers.parseEther(amountEth)
    });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async releaseFunds(agreementId: string, proofHash: string): Promise<string> {
    const tx = await this.escrowContract.releaseFunds(agreementId, proofHash);
    const receipt = await tx.wait();
    return receipt.hash;
  }
}
