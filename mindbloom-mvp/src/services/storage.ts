/**
 * 本地存储服务
 * 使用 localStorage 进行数据持久化，支持 AES 加密
 */
import CryptoJS from 'crypto-js';

const SECRET_KEY = 'mindbloom-local-secret'; // 注意：生产环境应使用更安全的密钥管理

export const storage = {
  /**
   * 保存数据到 localStorage（加密）
   * @param key 存储键
   * @param data 要保存的数据
   */
  save: (key: string, data: any) => {
    try {
      const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
      localStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },

  /**
   * 从 localStorage 加载数据（解密）
   * @param key 存储键
   * @returns 解析后的数据，如果不存在或解析失败返回 null
   */
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

  /**
   * 从 localStorage 清除数据
   * @param key 存储键
   */
  clear: (key: string) => {
    localStorage.removeItem(key);
  }
};