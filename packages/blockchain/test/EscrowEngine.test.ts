import { expect } from "chai";
import { ethers } from "hardhat";
import { EscrowEngine } from "../typechain-types";

describe("EscrowEngine", function () {
  let escrowEngine: EscrowEngine;
  let owner: any;
  let subscriber: any;
  let provider: any;

  beforeEach(async function () {
    [owner, subscriber, provider] = await ethers.getSigners();
    const EscrowEngineFactory = await ethers.getContractFactory("EscrowEngine");
    escrowEngine = await EscrowEngineFactory.deploy() as EscrowEngine;
  });

  it("should lock funds", async function () {
    const agreementId = "agreement-1";
    const amount = ethers.parseEther("1.0");

    await expect(escrowEngine.connect(subscriber).lockFunds(agreementId, provider.address, { value: amount }))
      .to.emit(escrowEngine, "FundsLocked")
      .withArgs(agreementId, subscriber.address, amount);

    const escrow = await escrowEngine.getEscrow(agreementId);
    expect(escrow.amount).to.equal(amount);
    expect(escrow.subscriber).to.equal(subscriber.address);
    expect(escrow.provider).to.equal(provider.address);
    expect(escrow.status).to.equal(1); // LOCKED
  });

  it("should release funds to provider when proof is submitted", async function () {
    const agreementId = "agreement-1";
    const amount = ethers.parseEther("1.0");
    const proofHash = "proof-123";

    await escrowEngine.connect(subscriber).lockFunds(agreementId, provider.address, { value: amount });

    const initialProviderBalance = await ethers.provider.getBalance(provider.address);

    await expect(escrowEngine.releaseFunds(agreementId, proofHash))
      .to.emit(escrowEngine, "FundsReleased")
      .withArgs(agreementId, provider.address, amount);

    const finalProviderBalance = await ethers.provider.getBalance(provider.address);
    expect(finalProviderBalance - initialProviderBalance).to.equal(amount);

    const escrow = await escrowEngine.getEscrow(agreementId);
    expect(escrow.status).to.equal(2); // RELEASED
    expect(escrow.proofHash).to.equal(proofHash);
    expect(escrow.amount).to.equal(0);
  });

  it("should fail if release is called without proof", async function () {
    const agreementId = "agreement-1";
    const amount = ethers.parseEther("1.0");

    await escrowEngine.connect(subscriber).lockFunds(agreementId, provider.address, { value: amount });

    await expect(escrowEngine.releaseFunds(agreementId, ""))
      .to.be.revertedWith("Proof hash is required");
  });
});
