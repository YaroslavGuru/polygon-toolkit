import "dotenv/config";
import hre from "hardhat";
import { formatEther, createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygonAmoy } from "viem/chains";

async function main() {
  console.log("🚀 Deploying contracts to Polygon Amoy...\n");

  // Get network config
  const networkConfig = hre.config.networks.polygonAmoy;
  if (!networkConfig || !networkConfig.url) {
    throw new Error("Polygon Amoy network not configured. Please set API_URL in .env");
  }

  if (!networkConfig.accounts || networkConfig.accounts.length === 0) {
    throw new Error("No private key configured. Please set PRIVATE_KEY in .env");
  }

  // Create account from private key
  const account = privateKeyToAccount(networkConfig.accounts[0] as `0x${string}`);

  // Create clients
  const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: http(networkConfig.url)
  });

  const walletClient = createWalletClient({
    account,
    chain: polygonAmoy,
    transport: http(networkConfig.url)
  });

  console.log("Deploying with account:", account.address);

  // Check balance
  const balance = await publicClient.getBalance({ 
    address: account.address 
  });
  console.log("Balance:", formatEther(balance), "MATIC\n");

  // Helper function to deploy contract
  async function deployContract(contractName: string, constructorArgs: any[] = []) {
    const artifact = await hre.artifacts.readArtifact(contractName);
    const bytecode = artifact.bytecode as `0x${string}`;
    const abi = artifact.abi;

    const hash = await walletClient.deployContract({
      abi: abi,
      bytecode: bytecode,
      args: constructorArgs,
      account
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.contractAddress!;
  }

  // Deploy ERC20
  console.log("📝 Deploying ERC20Token...");
  const erc20Address = await deployContract("ERC20Token", ["MyToken", "MTK", 1_000_000n]);
  console.log("✅ ERC20 deployed at:", erc20Address);

  // Deploy ERC721
  console.log("\n📝 Deploying ERC721Token...");
  const erc721Address = await deployContract("ERC721Token", ["YaroslavNFT", "MNFT"]);
  console.log("✅ ERC721 deployed at:", erc721Address);

  // Deploy ERC1155
  console.log("\n📝 Deploying ERC1155Token...");
  const erc1155Address = await deployContract("ERC1155Token", ["https://mygame.io/metadata/{id}.json"]);
  console.log("✅ ERC1155 deployed at:", erc1155Address);

  // Save deployment info
  const deployments = {
    network: "polygonAmoy",
    timestamp: new Date().toISOString(),
    deployer: account.address,
    contracts: {
      ERC20Token: {
        address: erc20Address,
        args: ["MyToken", "MTK", "1000000"]
      },
      ERC721Token: {
        address: erc721Address,
        args: ["YaroslavNFT", "MNFT"]
      },
      ERC1155Token: {
        address: erc1155Address,
        args: ["https://mygame.io/metadata/{id}.json"]
      }
    }
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deployments, null, 2));

  // Verification commands
  console.log("\n🔍 Verify contracts with:");
  console.log(`npx hardhat verify --network polygonAmoy ${erc20Address} "MyToken" "MTK" 1000000`);
  console.log(`npx hardhat verify --network polygonAmoy ${erc721Address} "YaroslavNFT" "MNFT"`);
  console.log(`npx hardhat verify --network polygonAmoy ${erc1155Address} "https://mygame.io/metadata/{id}.json"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
