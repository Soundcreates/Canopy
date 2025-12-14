require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Validate required environment variables
if (!process.env.POLYGON_AMOY_URL) {
  throw new Error("POLYGON_AMOY_URL is not set in .env file. Please add a valid Polygon Amoy RPC URL.");
}

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is not set in .env file. Please add your wallet private key.");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",

  networks: {
    "polygon-amoy": {
      url: process.env.POLYGON_AMOY_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    "sepolia": {
      url: process.env.SEPOLIA_URL,
      accounts : process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
