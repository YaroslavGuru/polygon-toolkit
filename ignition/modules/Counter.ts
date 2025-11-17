import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CounterModule", (m) => {
  const counter = m.contract("Counter");

  // Initialize counter by incrementing it once
  m.call(counter, "increment", []);

  return { counter };
});
