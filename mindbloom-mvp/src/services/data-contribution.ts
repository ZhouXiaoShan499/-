/**
 * MindBloom 数据贡献服务
 * 允许用户选择性地匿名贡献情绪记录，用于改进 AI 模型
 * 所有数据本地处理，不包含个人身份信息
 */

// 贡献的数据项格式
export interface ContributedData {
  id: string;
  text: string;
  labels: string[];
  timestamp: number;
  sessionId: string;
  version: string; // 应用版本
}

// 贡献统计
export interface ContributionStats {
  totalContributions: number;
  lastContribution: number | null;
  labelDistribution: Record<string, number>;
}

// 数据贡献服务类
class DataContributionService {
  private STORAGE_KEY = "mindbloom_contributions";
  private STATS_KEY = "mindbloom_contribution_stats";
  private MAX_LOCAL_STORAGE = 1000; // 本地最多存储 1000 条待导出数据

  /**
   * 生成唯一会话 ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * 生成唯一数据项 ID
   */
  private generateItemId(): string {
    return typeof crypto.randomUUID === "function" 
      ? crypto.randomUUID() 
      : this.fallbackUuid();
  }

  private fallbackUuid(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 匿名化处理文本
   * 移除可能的个人身份信息
   */
  private anonymizeText(text: string): string {
    return text
      // 移除手机号
      .replace(/1[3-9]\d{9}/g, "[手机号]")
      // 移除邮箱
      .replace(/[\w.-]+@[\w.-]+\.\w+/g, "[邮箱]")
      // 移除 QQ 号
      .replace(/(?<!\d)\d{5,12}(?!\d)/g, "[QQ号]")
      // 移除中文人名（简单模式）
      .replace(/[\u4e00-\u9fa5]{2,3}(?:先生|女士|同学|朋友|老师|爸爸|妈妈|哥哥|姐姐|弟弟|妹妹)/g, "[人名]")
      // 移除网址
      .replace(/https?:\/\/[^\s]+/g, "[网址]")
      //  trimming
      .trim();
  }

  /**
   * 询问用户是否贡献数据
   * 在用户完成情绪记录后调用
   */
  askForContribution(
    text: string,
    labels: string[],
    onResult: (contributed: boolean) => void
  ): void {
    // 检查是否已经贡献过当前会话
    const stats = this.getStats();
    const today = new Date().toDateString();
    const lastContribution = stats.lastContribution
      ? new Date(stats.lastContribution).toDateString()
      : "";

    // 如果今天已经贡献过，不再询问
    if (today === lastContribution) {
      onResult(false);
      return;
    }

    // 在实际应用中，这里应该弹出一个 UI 组件
    // 由于这是服务层，我们使用回调来处理用户选择
    // 在 UI 层，你可以这样实现：
    //
    // ```tsx
    // const [showContributionPrompt, setShowContributionPrompt] = useState(false);
    //
    // useEffect(() => {
    //   dataContributionService.askForContribution(
    //     text,
    //     labels,
    //     (contributed) => {
    //       setShowContributionPrompt(false);
    //       if (contributed) {
    //         // 更新 UI 状态
    //       }
    //     }
    //   );
    //   setShowContributionPrompt(true);
    // }, []);
    //
    // {showContributionPrompt && (
    //   <div className="contribution-prompt">
    //     <p>是否帮助改善 MindBloom 的情绪识别？</p>
    //     <p className="hint">此操作将匿名贡献您的情绪记录，不包含个人信息</p>
    //     <div className="buttons">
    //       <button onClick={() => dataContributionService.submitContribution(text, labels)}>
    //         愿意帮助 🌱
    //       </button>
    //       <button onClick={() => setShowContributionPrompt(false)}>
    //         下次再说
    //       </button>
    //     </div>
    //   </div>
    // )}
    
    // 默认不自动贡献，等待用户明确选择
    onResult(false);
  }

  /**
   * 提交贡献数据
   */
  submitContribution(text: string, labels: string[]): boolean {
    try {
      const anonymizedText = this.anonymizeText(text);
      
      // 检查文本长度，太短的文本没有训练价值
      if (anonymizedText.length < 5) {
        console.warn("文本太短，无法贡献");
        return false;
      }

      const contribution: ContributedData = {
        id: this.generateItemId(),
        text: anonymizedText,
        labels: labels.slice(0, 3), // 最多保留 3 个标签
        timestamp: Date.now(),
        sessionId: this.generateSessionId(),
        version: import.meta.env.VITE_APP_VERSION || "1.0.0"
      };

      // 保存到本地存储
      this.saveContribution(contribution);
      
      // 更新统计
      this.updateStats(contribution);
      
      console.log("✅ 数据贡献已保存（本地）");
      return true;
    } catch (error) {
      console.error("❌ 数据贡献失败:", error);
      return false;
    }
  }

  /**
   * 保存单条贡献到本地存储
   */
  private saveContribution(contribution: ContributedData): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const contributions: ContributedData[] = stored ? JSON.parse(stored) : [];
      
      // 检查是否重复（基于文本哈希）
      const textHash = this.hashText(contribution.text);
      const isDuplicate = contributions.some(
        c => this.hashText(c.text) === textHash
      );
      
      if (isDuplicate) {
        console.warn("重复数据，已跳过");
        return;
      }
      
      // 添加哈希用于快速去重
      (contribution as unknown as Record<string, unknown>).textHash = textHash;
      
      contributions.push(contribution);
      
      // 限制本地存储数量
      if (contributions.length > this.MAX_LOCAL_STORAGE) {
        contributions.shift(); // 移除最旧的
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(contributions));
    } catch (error) {
      console.error("保存贡献数据失败:", error);
    }
  }

  /**
   * 更新贡献统计
   */
  private updateStats(contribution: ContributedData): void {
    try {
      const stats = this.getStats();
      stats.totalContributions += 1;
      stats.lastContribution = contribution.timestamp;
      
      for (const label of contribution.labels) {
        stats.labelDistribution[label] = (stats.labelDistribution[label] || 0) + 1;
      }
      
      localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error("更新统计失败:", error);
    }
  }

  /**
   * 获取贡献统计
   */
  getStats(): ContributionStats {
    try {
      const stored = localStorage.getItem(this.STATS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("读取统计失败:", error);
    }
    
    return {
      totalContributions: 0,
      lastContribution: null,
      labelDistribution: {}
    };
  }

  /**
   * 获取所有待导出的贡献数据
   */
  getExportableData(): ContributedData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const contributions: Array<ContributedData & { textHash?: string }> = JSON.parse(stored);
        // 移除内部字段（textHash）
        return contributions.map(({ textHash, ...data }) => data as ContributedData);
      }
    } catch (error) {
      console.error("读取贡献数据失败:", error);
    }
    return [];
  }

  /**
   * 导出为训练格式
   */
  exportForTraining(): Array<{ text: string; label: string }> {
    const contributions = this.getExportableData();
    
    return contributions.map(c => ({
      text: c.text,
      label: c.labels[0] // 使用第一个标签作为主标签
    }));
  }

  /**
   * 导出为 JSON 文件（供开发者下载）
   */
  exportToFile(): void {
    const data = this.exportForTraining();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindbloom-contribution-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 清除所有贡献数据
   */
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STATS_KEY);
    console.log("✅ 所有贡献数据已清除");
  }

  /**
   * 清除已导出的数据
   */
  clearExportedData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log("✅ 已导出数据已清除");
  }

  /**
   * 简单文本哈希（用于去重）
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * 检查是否允许贡献（用户设置开关）
   */
  isContributionEnabled(): boolean {
    try {
      const settings = localStorage.getItem("mindbloom_settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.allowDataContribution !== false; // 默认允许
      }
    } catch (error) {
      console.error("读取设置失败:", error);
    }
    return true;
  }

  /**
   * 设置是否允许数据贡献
   */
  setContributionEnabled(enabled: boolean): void {
    try {
      const settingsStr = localStorage.getItem("mindbloom_settings");
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      settings.allowDataContribution = enabled;
      localStorage.setItem("mindbloom_settings", JSON.stringify(settings));
    } catch (error) {
      console.error("保存设置失败:", error);
    }
  }
}

// 导出单例
export const dataContributionService = new DataContributionService();

export default dataContributionService;