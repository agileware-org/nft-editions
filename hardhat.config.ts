import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import { HardhatUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";
import '@openzeppelin/hardhat-upgrades';
import "solidity-coverage";
import "hardhat-deploy";
import 'hardhat-gas-reporter';

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY! ||
  "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"; // well known private key
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
  defaultNetwork: "rinkeby",
  namedAccounts: {
    deployer: {
      default: 0,
      1: '0xDEE48aB42ceEb910c8C61a8966A57Dcf3E8B6706', 
      4: '0xDEE48aB42ceEb910c8C61a8966A57Dcf3E8B6706', 
    }
  },
  solidity: {
    compilers: [{ 
      version: "0.8.9", 
      settings: {
        optimizer: {
          runs: 200000,
          enabled: true
        }
      }
    }],
  },
  networks: {
    hardhat: {},
    localhost: {},
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    coverage: {
      url: "http://127.0.0.1:8545", // Coverage launches its own ganache-cli client
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`, 
      gasPrice: 50000000000, // 50 Gwei
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    currency: 'USD',
    enabled: process.env.REPORT_GAS == "true" || false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10,
  },
  typechain: {
    outDir: 'src/types'
  }
};

export default config;
