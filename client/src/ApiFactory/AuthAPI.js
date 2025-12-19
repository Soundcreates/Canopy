import { showToast } from '../utils/toast';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

export const verifyAuth = async (address , message , signature) => {
    console.log('Verifying authentication...from frontend');
    showToast.info('Verifying wallet signature...');
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
            showToast.success('Authentication successful! Welcome to Canopy.');
            return  true;
        }
        showToast.error('Authentication failed. Please try again.');
        return false;
    }catch(error){
        console.error('Error verifying authentication from frontend:', error);
        showToast.error(`Authentication error: ${error.message}`);
        return false;
    }
}