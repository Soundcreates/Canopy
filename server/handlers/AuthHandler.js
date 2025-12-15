const { verifyMessage } = require('ethers');


function verifyAuth(req, res) {
    console.log("AuthHandler is in action");
    //getting the address, message and signature from the request body
    const { address, message, signature } = req.body;
    console.log("Address: ", address);
    console.log("Message: ", message);
    console.log("Signature: ", signature);
    //small error handling
    if (!address || !message || !signature) {
        console.log("Some fields are absent!");
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // Validate signature format (should be hex string starting with 0x)
    if (!signature.startsWith('0x') || signature.length < 130) {
        console.log("Invalid signature format - signature should be a hex string starting with 0x");
        return res.status(400).json({ error: 'Invalid signature format' });
    }

    //try and caatch error handling for the verification of the signature passed from the fronted
    console.log("Trying to verify the signature");
    try {
        console.log("Verifying the signature");
        // verifyMessage takes (message, signature) and returns the recovered address
        const recoveredAddress = verifyMessage(message, signature);
        console.log("Recovered Address: ", recoveredAddress);
        console.log("Provided Address: ", address);
        
        // Compare addresses case-insensitively
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            console.log("Invalid signature - addresses do not match");
            return res.status(401).json({ error: 'Invalid signature' });
        }
        console.log("Signature verified successfully!");
    } catch (error) {
        console.log("Error verifying the signature: ", error);
        return res.status(401).json({ error: 'Invalid signature', details: error.message });
    }

    //if this gets executed, that means the recoveredAddr ==  clients addr
    return res.status(200).json({ message: 'Authentication successful' });
}


module.exports = { verifyAuth };
