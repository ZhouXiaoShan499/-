import CryptoJS from 'crypto-js';

const SECRET_KEY = 'mindbloom-local-secret'; // In a real app, this might be derived from user input or machine ID

export const storage = {
  save: (key: string, data: any) => {
    try {
      const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
      localStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },

  load: (key: string) => {
    try {
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) return null;
      
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return decryptedData;
    } catch (error) {
      console.error('Error loading from storage:', error);
      return null;
    }
  },

  clear: (key: string) => {
    localStorage.removeItem(key);
  }
};
