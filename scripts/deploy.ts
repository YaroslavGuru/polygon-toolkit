import { ethers } from "hardhat";

async function main() {
  const initialSupply = ethers.parseUnits("1000000", 18); // 1M tokens

  const Token = await ethers.getContractFactory("Yaroslav");
  const token = await Token.deploy(initialSupply);

  await token.waitForDeployment();

  console.log(`Yaroslav token deployed at: ${await token.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
