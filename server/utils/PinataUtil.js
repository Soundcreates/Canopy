const { PinataSDK } = require("pinata");
const { Blob } = require("buffer");
require("dotenv").config();

//This code has everything related to pinata

// Initialize Pinata SDK
let pinata = null;
let gatewayUrl = null;

function initializePinata() {
    console.log("Initializing Pinata SDK");
    const pinataJwt = process.env.PINATA_JWT;
    
    if (!pinataJwt) {
        console.log("PINATA_JWT not found in environment variables");
        throw new Error('Pinata JWT is required. Set PINATA_JWT in .env');
    }
    console.log("PINATA_JWT found");
    
    gatewayUrl = process.env.GATEWAY_URL || "https://gateway.pinata.cloud";
    console.log("Gateway URL:", gatewayUrl);
    
    pinata = new PinataSDK({
        pinataJwt: pinataJwt,
        pinataGateway: gatewayUrl
    });
    console.log("Pinata SDK initialized successfully");
    return pinata;
}

async function uploadImageToIPFS(imageBuffer, fileName = null) {
    console.log("Starting image upload to Pinata IPFS");
    console.log("Image buffer size:", imageBuffer.length, "bytes");
    
    try {
        // Initialize Pinata if not already initialized
        if (!pinata) {
            initializePinata();
        }
        
        console.log("Preparing file for upload");
        const finalFileName = fileName || `nft-image-${Date.now()}.png`;
        console.log("Final filename:", finalFileName);
        console.log("Image buffer type:", imageBuffer.constructor.name);
        console.log("Image buffer length:", imageBuffer.length);
        
        // Convert Buffer to Blob, then to File (as per Pinata SDK requirements)
        console.log("Converting buffer to Blob");
        const blob = new Blob([imageBuffer], { type: 'image/png' });
        console.log("Blob created, size:", blob.size, "bytes");
        
        console.log("Converting Blob to File");
        const file = new File([blob], finalFileName, { type: 'image/png' });
        console.log("File created with name:", file.name, "and type:", file.type);
        
        console.log("Uploading file to Pinata IPFS");
        console.log("Using pinata.upload.public.file() method");
        const upload = await pinata.upload.public.file(file);
        console.log("Upload response received from Pinata");
        console.log("Upload response:", JSON.stringify(upload, null, 2));
        
        const ipfsHash = upload.IpfsHash || upload.cid;
        console.log("IPFS hash extracted:", ipfsHash);
        
        if (!ipfsHash) {
            console.log("No IPFS hash found in upload response");
            throw new Error('Failed to get IPFS hash from Pinata response');
        }
        
        const ipfsUri = `ipfs://${ipfsHash}`;
        console.log("IPFS URI constructed:", ipfsUri);
        
        const fullGatewayUrl = `${gatewayUrl}/ipfs/${ipfsHash}`;
        console.log("IPFS gateway URL:", fullGatewayUrl);
        
        console.log("Image successfully uploaded to Pinata IPFS");
        console.log("IPFS Hash:", ipfsHash);
        console.log("IPFS URI:", ipfsUri);
        
        return ipfsUri;
    } catch (error) {
        console.error("Error uploading image to Pinata IPFS:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        throw error;
    }
}

async function uploadMetadataToIPFS(metadata, fileName = null) {
    console.log("Starting metadata upload to Pinata IPFS");
    console.log("Metadata object:", JSON.stringify(metadata, null, 2));
    
    try {
        // Initialize Pinata if not already initialized
        if (!pinata) {
            initializePinata();
        }
        
        console.log("Converting metadata to JSON string");
        const metadataJson = JSON.stringify(metadata, null, 2);
        console.log("Metadata JSON string length:", metadataJson.length, "characters");
        
        console.log("Preparing metadata file for upload");
        const finalFileName = fileName || `metadata-${Date.now()}.json`;
        console.log("Final filename:", finalFileName);
        
        // Convert JSON string to Blob, then to File
        console.log("Converting metadata JSON to Blob");
        const blob = new Blob([metadataJson], { type: 'application/json' });
        console.log("Blob created, size:", blob.size, "bytes");
        
        console.log("Converting Blob to File");
        const file = new File([blob], finalFileName, { type: 'application/json' });
        console.log("File created with name:", file.name, "and type:", file.type);
        
        console.log("Uploading metadata file to Pinata IPFS");
        console.log("Using pinata.upload.public.file() method");
        const upload = await pinata.upload.public.file(file);
        console.log("Upload response received from Pinata");
        console.log("Upload response:", JSON.stringify(upload, null, 2));
        
        const ipfsHash = upload.IpfsHash || upload.cid;
        console.log("IPFS hash extracted:", ipfsHash);
        
        if (!ipfsHash) {
            console.log("No IPFS hash found in upload response");
            throw new Error('Failed to get IPFS hash from Pinata response');
        }
        
        const ipfsUri = `ipfs://${ipfsHash}`;
        console.log("IPFS URI constructed:", ipfsUri);
        
        const fullGatewayUrl = `${gatewayUrl}/ipfs/${ipfsHash}`;
        console.log("IPFS gateway URL:", fullGatewayUrl);
        
        console.log("Metadata successfully uploaded to Pinata IPFS");
        console.log("IPFS Hash:", ipfsHash);
        console.log("IPFS URI:", ipfsUri);
        
        return ipfsUri;
    } catch (error) {
        console.error("Error uploading metadata to Pinata IPFS:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        throw error;
    }
}

//the functions above focused on uploading the image and metadata to the ipfs hash to get a unique cid which will be used to get the image 
//the function below will help us to get the image from the ipfs hash
async function getImageFromIPFS(ipfsHash) {
    console.log("Getting image from IPFS");
    console.log("IPFS hash:", ipfsHash);

    try {
        // initialize pinata if not already initialized (to get gateway url)
        if (!pinata) {
            initializepinata();
        }
        
        // extract hash from ipfs:// uri if provided
        let hash = ipfsHash;
        if (ipfsHash.startsWith('ipfs://')) {
            hash = ipfsHash.replace('ipfs://', '');
            console.log("extracted hash from ipfs:// uri:", hash);
        }
        console.log("using ipfs hash:", hash);
        
        // constructin gateway url
        const gatewayUrlToUse = gatewayUrl || "https://gateway.pinata.cloud";
        const imageurl = `${gatewayUrlToUse}/ipfs/${hash}`;
        console.log("constructed gateway url:", imageurl);
        
        // fetch image from ipfs gateway
        console.log("fetching image from ipfs gateway");
        const response = await fetch(imageurl);
        console.log("response status:", response.status);
        console.log("response headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        
        if (!response.ok) {
            console.log("failed to fetch image from ipfs gateway");
            throw new Error(`failed to fetch image from ipfs: ${response.status} ${response.statusText}`);
        }
        
        // convert response to buffer
        console.log("converting response to arraybuffer");
        const arraybuffer = await response.arrayBuffer();
        console.log("arraybuffer received, size:", arraybuffer.byteLength, "bytes");
        const buffer = Buffer.from(arraybuffer);
        console.log("buffer created, size:", buffer.length, "bytes");
        
        console.log("image successfully fetched from ipfs");
        console.log("image buffer size:", buffer.length, "bytes");
        
        return buffer;
    } catch (error) {
        console.error("Error getting image from IPFS:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        throw error;
    }
}

module.exports = {
    uploadImageToIPFS,
    uploadMetadataToIPFS,
    getImageFromIPFS
};
