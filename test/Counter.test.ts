import { test } from "node:test";
import assert from "assert";
import { viem } from "@nomicfoundation/hardhat-toolbox-viem";

test("Counter: increment and decrement correctly", async () => {
  const wallet = await viem.getWalletClients()[0];
  
  // Deploy Counter.sol
  const counter = await viem.deployContract("Counter", {
    wallet
  });

  // Initial value should be 0
  let value = await counter.read.getNumber();
  assert.equal(value, 0n);

  // Increment once
  await counter.write.increment();
  value = await counter.read.getNumber();
  assert.equal(value, 1n);

  // Increment twice
  await counter.write.increment();
  value = await counter.read.getNumber();
  assert.equal(value, 2n);

  // Decrement once
  await counter.write.decrement();
  value = await counter.read.getNumber();
  assert.equal(value, 1n);
});
