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

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  // Local Hardhat network
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    hardhat: {
      chainId: 31337,
    },
  },

  // IMPORTANT: remove etherscan completely to avoid calling API on localhost
  etherscan: undefined,
};

export default config;
