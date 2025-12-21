const { ethers } = require('ethers');
const CTKTokenData = require('../client/src/contractData/CTKToken.json');
require('dotenv').config();

async function checkBalance() {
    try {
        console.log('🔍 Checking Token Balance');
        console.log('========================\n');

        const userAddress = '0x35fDe5297861Ea67132E57C3Efb29BE1eA2494DD';
        console.log(`User Address: ${userAddress}\n`);

        // Connect to blockchain
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');

        // Connect to CTK Token contract (read-only)
        const ctkToken = new ethers.Contract(
            CTKTokenData.address,
            CTKTokenData.abi,
            provider
        );

        console.log(`CTK Token Contract: ${CTKTokenData.address}\n`);

        // Check balance
        const balance = await ctkToken.balanceOf(userAddress);
        const formatted = ethers.formatEther(balance);

        console.log(`Balance (wei): ${balance.toString()}`);
        console.log(`Balance (ether): ${formatted} CTK\n`);

        // Check if user has received signup bonus
        try {
            const hasBonus = await ctkToken.hasReceivedSignupBonus(userAddress);
            console.log(`Has Received Signup Bonus: ${hasBonus}`);
        } catch (e) {
            console.log('Could not check signup bonus status');
        }

        console.log('\n✅ Balance check completed!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

checkBalance();
