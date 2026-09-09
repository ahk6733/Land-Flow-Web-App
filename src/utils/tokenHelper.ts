import CryptoJS from 'crypto-js';

const SECRET_KEY = 'land_buy_sell_ms_secret_token_key_2026_xYz98';

export interface TokenPayload {
  id: string;
  amount: number;
  createdAt: string;
}

export const generateTokenFileContent = (amount: number): string => {
  const payload: TokenPayload = {
    id: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    amount,
    createdAt: new Date().toISOString()
  };
  
  const jsonStr = JSON.stringify(payload);
  const encrypted = CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
  
  return `-----BEGIN LAND MS TOKEN-----\n${encrypted}\n-----END LAND MS TOKEN-----`;
};

export const parseTokenFileContent = (fileContent: string): TokenPayload | null => {
  try {
    const lines = fileContent.trim().split('\n');
    if (lines[0].trim() !== '-----BEGIN LAND MS TOKEN-----' || lines[lines.length - 1].trim() !== '-----END LAND MS TOKEN-----') {
      return null;
    }
    
    const encrypted = lines.slice(1, lines.length - 1).join('');
    
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedStr) return null;
    
    return JSON.parse(decryptedStr) as TokenPayload;
  } catch (error) {
    console.error('Invalid token file format', error);
    return null;
  }
};
