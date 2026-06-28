import { expect } from "chai";
import { ethers } from "hardhat";
import { EscrowEngine } from "../typechain-types";

describe("Escrow Integration Flow", function () {
  let escrowEngine: EscrowEngine;
  let subscriber: any;
  let provider: any;

  beforeEach(async function () {
    [subscriber, provider] = await ethers.getSigners();
    const EscrowEngineFactory = await ethers.getContractFactory("EscrowEngine");
    escrowEngine = await EscrowEngineFactory.deploy() as EscrowEngine;
  });

  it("should complete the full cycle: Lock -> Release", async function () {
    const agreementId = "agg-full-cycle";
    const amount = ethers.parseEther("0.5");
    const proofHash = "proof-full-cycle";

    // 1. Lock
    await escrowEngine.connect(subscriber).lockFunds(agreementId, provider.address, { value: amount });
    let escrow = await escrowEngine.getEscrow(agreementId);
    expect(escrow.status).to.equal(1); // LOCKED

    // 2. Release
    await escrowEngine.releaseFunds(agreementId, proofHash);
    escrow = await escrowEngine.getEscrow(agreementId);
    expect(escrow.status).to.equal(2); // RELEASED
    expect(escrow.proofHash).to.equal(proofHash);
  });
});
