/**
 * 本地存储服务
 * 使用 localStorage 进行数据持久化
 * 
 * 注意：数据以明文形式存储在浏览器本地，不提供加密保护
 * 适用于 MVP 阶段，数据仅在本地使用，不涉及跨设备同步
 */

export const storage = {
  /**
   * 保存数据到 localStorage
   * @param key 存储键
   * @param data 要保存的数据
   */
  save: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to storage:', error);
      // 可能是存储空间已满
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded. Consider clearing old data.');
      }
    }
  },

  /**
   * 从 localStorage 加载数据
   * @param key 存储键
   * @returns 解析后的数据，如果不存在或解析失败返回 null
   */
  load: (key: string) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
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