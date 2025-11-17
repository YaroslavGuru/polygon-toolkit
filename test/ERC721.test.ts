import { test } from "node:test";
import assert from "assert";
import { viem } from "@nomicfoundation/hardhat-toolbox-viem";

test("ERC721: mint", async () => {
  const wallet = await viem.getWalletClients()[0];

  const nft = await viem.deployContract("ERC721Token", {
    args: ["TestNFT", "TNFT"],
    wallet
  });

  await nft.write.safeMint([wallet.account.address]);
  const owner = await nft.read.ownerOf([0n]);

  assert.equal(owner, wallet.account.address);
});
