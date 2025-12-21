const { ethers } = require('ethers');
const CTKTokenData = require('../client/src/contractData/CTKToken.json');
require('dotenv').config();

async function mintTokensToUser() {
    try {
        console.log('🪙 Token Minting Script');
        console.log('======================\n');

        // Get user address from command line or use default
        const userAddress = process.argv[2];

        if (!userAddress) {
            console.error('❌ Error: Please provide user address as argument');
            console.log('Usage: node mint_tokens.js <USER_ADDRESS> [AMOUNT]');
            process.exit(1);
        }

        const amount = process.argv[3] || '600'; // Default to 600 CTK

        console.log(`User Address: ${userAddress}`);
        console.log(`Amount to Mint: ${amount} CTK\n`);

        // Connect to blockchain
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');

        // Get oracle wallet (has minting permissions)
        const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY;
        if (!oraclePrivateKey) {
            console.error('❌ Error: ORACLE_PRIVATE_KEY not found in .env');
            process.exit(1);
        }

        const oracleWallet = new ethers.Wallet(oraclePrivateKey, provider);
        console.log(`Oracle Address: ${oracleWallet.address}\n`);

        // Connect to CTK Token contract
        const ctkToken = new ethers.Contract(
            CTKTokenData.address,
            CTKTokenData.abi,
            oracleWallet
        );

        console.log(`CTK Token Contract: ${CTKTokenData.address}\n`);

        // Check current balance
        const currentBalance = await ctkToken.balanceOf(userAddress);
        console.log(`Current Balance: ${ethers.formatEther(currentBalance)} CTK`);

        // Convert amount to wei
        const amountInWei = ethers.parseEther(amount);
        console.log(`Amount in Wei: ${amountInWei.toString()}\n`);

        // Mint tokens
        console.log('⏳ Minting tokens...');
        const tx = await ctkToken.mint(userAddress, amountInWei);
        console.log(`Transaction Hash: ${tx.hash}`);

        console.log('⏳ Waiting for confirmation...');
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}\n`);

        // Check new balance
        const newBalance = await ctkToken.balanceOf(userAddress);
        console.log(`New Balance: ${ethers.formatEther(newBalance)} CTK`);
        console.log(`Minted: ${ethers.formatEther(amountInWei)} CTK\n`);

        console.log('✅ Minting completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.reason) {
            console.error('Reason:', error.reason);
        }
        process.exit(1);
    }
}

mintTokensToUser();
