import { test } from "node:test";
import assert from "assert";
import { viem } from "@nomicfoundation/hardhat-toolbox-viem";

test("ERC20: deployment + initial supply", async () => {
  const client = await viem.getPublicClient();
  const wallet = await viem.getWalletClients()[0];

  const factory = await viem.deployContract("ERC20Token", {
    args: ["TestToken", "TT", 1000n],
    wallet
  });

  const totalSupply = await factory.read.totalSupply();
  assert.equal(totalSupply, 1000n);

  const name = await factory.read.name();
  assert.equal(name, "TestToken");
});
