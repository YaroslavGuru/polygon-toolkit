import { test } from "node:test";
import assert from "assert";
import { viem } from "@nomicfoundation/hardhat-toolbox-viem";

test("ERC1155: mint", async () => {
  const wallet = await viem.getWalletClients()[0];

  const erc1155 = await viem.deployContract("ERC1155Token", {
    args: ["https://example.com/{id}.json"],
    wallet
  });

  await erc1155.write.mint([wallet.account.address, 1n, 10n, "0x"]);

  const balance = await erc1155.read.balanceOf([
    wallet.account.address,
    1n
  ]);

  assert.equal(balance, 10n);
});
