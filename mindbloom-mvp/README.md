# MindBloom MVP - Local AI Emotion Support Tool

## 简介
MindBloom 是一个免登录、本地优先的情绪梳理工具。本项目基于 `mvp02.md` 的需求文档构建，核心功能包括：
- **免登录 & 本地加密存储**：数据完全存储在本地 `localStorage` 并使用 `AES` 加密。
- **本地 AI 情绪解析**：通过规则引擎（MVP阶段）自动提取情绪标签和关键词。
- **情绪卡片网络**：可视化展示情绪标签，支持拖拽、缩放及简单的连线。
- **隐藏解压游戏**：内置「气球捏破」小游戏，伴随治愈文字缓解压力。

## 技术栈
- **框架**: React 18 + Vite
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **动画**: Framer Motion (用于卡片拖拽、转场及游戏动画)
- **状态管理**: Zustand (轻量级全局状态管理)
- **加密**: Crypto-JS (用于本地数据加解密)
- **图标**: Lucide-React

## 目录结构
- `src/components/`: UI 组件库
  - `Chat/`: 智能体对话界面
  - `EmotionCard/`: 可视化情绪卡片画布
  - `Sidebar/`: 设置与隐藏模式开关
  - `Game/`: 解压小游戏全屏浮层
- `src/services/`: 业务逻辑服务
  - `storage.ts`: 加密存储服务
  - `ai-engine.ts`: 本地情绪分析引擎 (MVP)
- `src/store/`: 全局状态管理
- `src/styles/`: 全局样式定义

## 如何运行
1. 安装依赖:
   ```bash
   npm install
   ```
2. 启动开发服务器:
   ```bash
   npm run dev
   ```
3. 构建生产版本:
   ```bash
   npm run build
   ```

## 注意事项
- 本项目为 MVP 原型，所有数据均存储在浏览器本地缓存中。
- 情绪解析引擎目前基于关键词匹配规则，未来可扩展集成 WebLLM 或本地模型接口。
