// import * as dotenv from "dotenv";
// dotenv.config();

// import { HardhatUserConfig } from "hardhat/config";
// import "@nomicfoundation/hardhat-toolbox";

// const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "";
// const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
// const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

// if (!AMOY_RPC_URL || !PRIVATE_KEY) {
//   throw new Error("Please set AMOY_RPC_URL and PRIVATE_KEY in .env file");
// }

// const config: HardhatUserConfig = {
//   solidity: {
//     version: "0.8.20",
//     settings: {
//       optimizer: { enabled: true, runs: 200 }
//     }
//   },
//   networks: {
//     amoy: {
//       url: AMOY_RPC_URL,
//       accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
//       chainId: 80002
//     }
//   },
//   etherscan: {
//     apiKey: {
//       polygonAmoy: POLYGONSCAN_API_KEY
//     },
//     customChains: [
//       {
//         network: "polygonAmoy",
//         chainId: 80002,
//         urls: {
//           apiURL: "https://api-amoy.polygonscan.com/api",
//           browserURL: "https://amoy.polygonscan.com"
//         }
//       }
//     ]
//   }
// };

// export default config;

import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

// Environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || "";
const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    // Local Hardhat network
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    hardhat: {
      chainId: 31337,
    },
    // Polygon Amoy Testnet
    amoy: {
      url: POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80002,
    },
    // Polygon Mainnet
    polygon: {
      url: POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 137,
    },
  },

  etherscan: POLYGONSCAN_API_KEY ? {
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
      {
        network: "polygon",
        chainId: 137,
        urls: {
          apiURL: "https://api.polygonscan.com/api",
          browserURL: "https://polygonscan.com",
        },
      },
    ],
  } : undefined,
};

export default config;
