import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

export const verifyAuth = async (address , message , signature) => {
    console.log('Verifying authentication...from frontend');
    console.log('Address:', address);
    console.log('Message:', message);
    console.log('Signature:', signature);
    try{
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address, message, signature }),
        });

        if(response.status === 200){
            return  true;
        }
        return false;
    }catch(error){
        console.error('Error verifying authentication from frontend:', error);
        return false;
    }
}