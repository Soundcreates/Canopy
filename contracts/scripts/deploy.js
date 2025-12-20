//deploying the contracts

const {ethers} = require("hardhat");
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;

async function main() {

    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    console.log("Deploying w this deployers address: ", deployer.address);
    console.log("Deploying to network: ", network.name);
    
    // Get balance using provider
    const provider = ethers.provider;
    const balance = await provider.getBalance(deployer.address);
    console.log("Deployer balance: ", ethers.formatEther(balance), "ETH");

    //deploying ForestRegistry.sol
    const fr = await ethers.getContractFactory("ForestRegistry");
    const forestRegistry = await fr.deploy();
    await forestRegistry.waitForDeployment();
    const forestRegistryAddress = await forestRegistry.getAddress();
    console.log("ForestRegistry deployed to:", forestRegistryAddress);
    //writing the abi to the frontend and backend
    const fr_artifact = await hre.artifacts.readArtifact("ForestRegistry");
    const fr_data = {
        address: forestRegistryAddress,
        abi: fr_artifact.abi
    };


    // Ensure directories exist
    const clientDir = path.join(__dirname, "../../client/src/contractData");
    const serverDir = path.join(__dirname, "../../server/contractData");
    if (!fs.existsSync(clientDir)) {
        fs.mkdirSync(clientDir, { recursive: true });
        console.log("Created client contractData directory");
    }
    if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir, { recursive: true });
        console.log("Created server contractData directory");
    }
    
    // Write ForestRegistry to both client and server
    const frClientPath = path.join(clientDir, "ForestRegistry.json");
    const frServerPath = path.join(serverDir, "ForestRegistry.json");
    fs.writeFileSync(frClientPath, JSON.stringify(fr_data, null, 2));
    fs.writeFileSync(frServerPath, JSON.stringify(fr_data, null, 2));
    console.log("ForestRegistry data written to:", frClientPath);
    console.log("ForestRegistry data written to:", frServerPath);
 
    //Deploying CarbonCreditNFT.sol
    // Note: CarbonCreditNFT requires an oracle address in constructor
    // Using deployer address as placeholder if ORACLE_ADDRESS is not set
    console.log("Oracle address:", ORACLE_ADDRESS);
    const cc = await ethers.getContractFactory("CarbonCreditNFT");
    const carbonCreditNFT = await cc.deploy(ORACLE_ADDRESS);
    await carbonCreditNFT.waitForDeployment();
    const carbonCreditNFTAddress = await carbonCreditNFT.getAddress();
    console.log("CarbonCreditNFT deployed to:", carbonCreditNFTAddress);
    //writing the abi to the frontend and backend
    const cc_artifact = await hre.artifacts.readArtifact("CarbonCreditNFT");
    const cc_data = {
        address: carbonCreditNFTAddress,
        abi: cc_artifact.abi
    };
    
    // Write CarbonCreditNFT to both client and server
    const ccClientPath = path.join(clientDir, "CarbonCreditNFT.json");
    const ccServerPath = path.join(serverDir, "CarbonCreditNFT.json");
    fs.writeFileSync(ccClientPath, JSON.stringify(cc_data, null, 2));
    fs.writeFileSync(ccServerPath, JSON.stringify(cc_data, null, 2));
    console.log("CarbonCreditNFT data written to:", ccClientPath);
    console.log("CarbonCreditNFT data written to:", ccServerPath);

    //Deploying CTKToken.sol
    const ctk = await ethers.getContractFactory("CTKToken");
    // Deploy with 1,000,000 tokens (using parseEther to handle large numbers safely)
    const initialSupply = ethers.parseEther("1000000");
    const ctkToken = await ctk.deploy("Canopy Token", "CTK", initialSupply, ORACLE_ADDRESS);
    await ctkToken.waitForDeployment();
    const ctkTokenAddress = await ctkToken.getAddress();
    console.log("CTKToken deployed to:", ctkTokenAddress);
    //writing the abi to the frontend and backend
    const ctk_artifact = await hre.artifacts.readArtifact("CTKToken");
    const ctk_data = {
        address: ctkTokenAddress,
        abi: ctk_artifact.abi
    }
    //writing to backend and frontend
    const ctkClientPath = path.join(clientDir, "CTKToken.json");
    const ctkServerPath = path.join(serverDir, "CTKToken.json");
    fs.writeFileSync(ctkClientPath, JSON.stringify(ctk_data, null, 2));
    fs.writeFileSync(ctkServerPath, JSON.stringify(ctk_data, null, 2));
    console.log("CTKToken data written to:", ctkClientPath);
    console.log("CTKToken data written to:", ctkServerPath);


    //Deploying Governance.sol
    const governance = await ethers.getContractFactory("Governance");
    // Use ORACLE_ADDRESS or deployer address as fallback
    const oracleAddress = ORACLE_ADDRESS || deployer.address;
    const governanceContract = await governance.deploy(ctkTokenAddress, oracleAddress);
    await governanceContract.waitForDeployment();
    const governanceAddress = await governanceContract.getAddress();
    console.log("Governance deployed to:", governanceAddress);
    //writing the abi to the frontend and backend
    const governance_artifact = await hre.artifacts.readArtifact("Governance");

    const governance_data = {
        address: governanceAddress,
        abi: governance_artifact.abi
    }

    //writing to backend and frontend
    const governanceClientPath = path.join(clientDir, "Governance.json");
    const governanceServerPath = path.join(serverDir, "Governance.json");
    fs.writeFileSync(governanceClientPath, JSON.stringify(governance_data, null, 2));
    fs.writeFileSync(governanceServerPath, JSON.stringify(governance_data, null, 2));
    console.log("Governance data written to:", governanceClientPath);
    console.log("Governance data written to:", governanceServerPath);
}

main();
