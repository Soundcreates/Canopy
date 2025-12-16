import { useWallet } from '../contexts/WalletContext';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const registerForest = async(area , geoHash) => {
    console.log('Registering forest...from frontend');
    const {account} = useWallet();
    //fetching the signature, and message from localstorage
    const storedAuth = localStorage.getItem(`canopy_auth_${account.toLowerCase()}`);    
    const authData  = JSON.parse(storedAuth);
    try{
        if(!account){
            throw new Error('Wallet not connected');
        }
        const response = await fetch(`${API_BASE_URL}/api/forests/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${account}:${authData.signature}`,
            },
            body: JSON.stringify({ area, geoHash }),
        });
    }catch(error){
        console.error('Error registering forest from frontend:', error);
        throw error;
    }
}