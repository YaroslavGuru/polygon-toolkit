import { ethers } from "hardhat";

async function main() {
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const token = await ethers.getContractAt("Yaroslav", tokenAddress);

  console.log("Name:", await token.name());
  console.log("Symbol:", await token.symbol());

  const totalSupply = await token.totalSupply();
  console.log("Total supply:", totalSupply.toString());

  const [owner] = await ethers.getSigners();
  const balance = await token.balanceOf(owner.address);
  console.log("Owner balance:", balance.toString());
}

main();
