import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
    polygon: {
      url: process.env.POLYGON_RPC_URL || "",
      accounts: process.env.BLOCKCHAIN_DEPLOYER_PRIVATE_KEY ? [process.env.BLOCKCHAIN_DEPLOYER_PRIVATE_KEY] : [],
    },
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL || "",
      accounts: process.env.BLOCKCHAIN_DEPLOYER_PRIVATE_KEY ? [process.env.BLOCKCHAIN_DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};

export default config;
