const { verifyMessage } = require("ethers");

/**
 * Verifies that a signature was created by the owner of the given Ethereum address.
 * 
 * How it works:
 * 1. Takes the original message and signature
 * 2. Uses ECDSA recovery to extract the public key from the signature
 * 3. Derives the Ethereum address from that public key
 * 4. Compares it (case-insensitive) with the claimed address
 * 
 * This proves cryptographic ownership without storing any secrets.
 * 
 * @param {string} address - The Ethereum address that claims to have signed
 * @param {string} message - The original message that was signed
 * @param {string} signature - The hex signature from MetaMask
 * @returns {boolean} - True if the signature matches the address, false otherwise
 */
function verifyWalletSignature(address, message, signature) {
  try {
    // Recover the signer's address from the message and signature
    // This uses ECDSA (Elliptic Curve Digital Signature Algorithm) recovery
    const recoveredAddress = verifyMessage(message, signature);
    
    // Compare addresses case-insensitively (Ethereum addresses are case-insensitive)
    // This proves the caller owns the private key for this address
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    // Invalid signature format or corrupted data
    return false;
  }
}

module.exports = { verifyWalletSignature };

