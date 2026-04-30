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
=======

```
mindbloom-mvp/
├── index.html                  # 入口 HTML 文件
├── package.json                # 项目依赖与脚本配置
├── tsconfig.json               # TypeScript 编译配置
├── tsconfig.node.json          # Node 环境 TypeScript 配置
├── vite.config.ts              # Vite 构建工具配置
├── postcss.config.js           # PostCSS 配置
├── tailwind.config.js          # Tailwind CSS 主题配置
├── README.md                   # 项目说明文档
├── install.log                 # 依赖安装日志
│
└── src/                        # 源代码目录
    ├── main.tsx                # React 应用入口文件，渲染根组件
    ├── App.tsx                 # 主应用组件，组合所有页面组件
    ├── vite-env.d.ts           # Vite 类型声明文件
    │
    ├── components/             # UI 组件库
    │   ├── Chat/
    │   │   └── ChatArea.tsx    # 对话界面组件，支持文本/语音输入、消息展示、连接建议
    │   ├── EmotionCard/
    │   │   └── EmotionCanvas.tsx  # 情绪卡片画布，支持拖拽、连线、可视化展示
    │   ├── Game/
    │   │   ├── GameOverlay.tsx    # 解压游戏全屏浮层，仅负责布局
    │   │   ├── Balloon.tsx        # 气球子组件，负责渲染单个气球及动画
    │   │   └── WaterDrop.tsx      # 水滴子组件，负责渲染气球捏破后的水滴动画
    │   ├── Layout/
    │   │   └── Header.tsx         # 顶部导航栏，包含应用标题和菜单按钮
    │   └── Sidebar/
    │       └── Sidebar.tsx        # 侧边栏，包含会话列表、设置、情绪筛选等功能
    │
    ├── services/               # 业务逻辑服务层
    │   ├── ai-engine.ts        # 本地 AI 情绪分析引擎，包含情绪词典、主题匹配、回应生成、上下文感知
    │   ├── speech-recognition.ts  # 浏览器语音识别服务，支持中文语音转文字
    │   ├── audio.ts             # 游戏音频服务，提供气球捏破音效等功能
    │   └── storage.ts           # 加密存储服务，使用 AES 加密 localStorage 数据
    │
    ├── hooks/                  # 自定义 React Hooks
    │   └── useGameLogic.ts     # 游戏逻辑 Hook，管理气球、水滴状态和游戏事件处理
    │
    ├── store/                  # 全局状态管理
    │   └── useStore.ts         # Zustand store，管理会话、消息、卡片、连接、设置等全局状态
    │
    └── styles/                 # 全局样式定义
        └── index.css           # 全局 CSS 样式，包含 Tailwind 指令和自定义样式
```

### 各模块作用说明

| 模块 | 路径 | 作用 |
|------|------|------|
| **App.tsx** | `src/App.tsx` | 应用根组件，负责整体布局和各组件的组合 |
| **ChatArea.tsx** | `src/components/Chat/` | 对话界面，处理用户输入、AI 回复、语音识别、情绪分析展示 |
| **EmotionCanvas.tsx** | `src/components/EmotionCard/` | 情绪卡片可视化画布，支持拖拽移动、卡片连线、贝塞尔曲线连接 |
| **GameOverlay.tsx** | `src/components/Game/` | 全屏解压游戏，仅负责布局，游戏逻辑已抽离 |
| **Balloon.tsx** | `src/components/Game/` | 气球子组件，负责渲染单个气球及其拖拽、捏破动画 |
| **WaterDrop.tsx** | `src/components/Game/` | 水滴子组件，负责渲染气球捏破后的水滴下落动画 |
| **Sidebar.tsx** | `src/components/Sidebar/` | 侧边栏面板，管理多会话切换、情绪筛选、AI 风格设置、数据清理 |
| **Header.tsx** | `src/components/Layout/` | 顶部导航栏组件，显示应用 Logo 和菜单触发按钮 |
| **ai-engine.ts** | `src/services/` | 本地情绪分析引擎，基于规则匹配提取情绪标签、关键词、强度，生成治愈回应 |
| **speech-recognition.ts** | `src/services/` | 浏览器语音识别服务，封装 Web Speech API，支持中文语音输入 |
| **audio.ts** | `src/services/` | 游戏音频服务，提供气球捏破音效等功能 |
| **storage.ts** | `src/services/` | 加密存储服务，使用 CryptoJS AES 加密保护本地数据 |
| **useGameLogic.ts** | `src/hooks/` | 游戏逻辑 Hook，管理气球、水滴状态和游戏事件处理 |
| **useStore.ts** | `src/store/` | 全局状态管理，使用 Zustand 管理会话、消息、情绪卡片、连接和设置 |


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
