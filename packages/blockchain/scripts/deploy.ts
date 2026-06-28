import { ethers } from "hardhat";

async function main() {
  const AgreementRegistry = await ethers.getContractFactory("AgreementRegistry");
  const registry = await AgreementRegistry.deploy();

  await registry.waitForDeployment();

  console.log("AgreementRegistry deployed to:", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
