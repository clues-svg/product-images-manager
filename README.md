# Product Images Manager (产品图片管理系统)

这是一个全栈产品图片管理系统，旨在为电商卖家提供一站式的图片获取、处理、管理和 AI 生成解决方案。

## 📚 目录

1. [项目简介](#-项目简介)
2. [技术栈](#-技术栈)
3. [功能特性](#-功能特性)
4. [快速开始](#-快速开始)
5. [项目结构](#-项目结构)
6. [数据库设计](#-数据库设计)
7. [API 概览](#-api-概览)

---

## 🚀 项目简介

本系统解决了电商运营中图片素材处理繁琐的痛点。用户可以通过爬虫快速获取网络图片，使用内置工具进行去背景、改尺寸等处理，利用 AI 生成创意场景图，并对所有素材进行标签化管理。

## 🛠 技术栈

### 前端 (Frontend)
*   **框架**: React 18 + Vite
*   **UI 组件**: Ant Design 5.x
*   **状态管理**: React Query (TanStack Query)
*   **路由**: React Router DOM 6
*   **样式**: Less

### 后端 (Backend)
*   **运行时**: Node.js + Express
*   **数据库**: MySQL (Sequelize ORM)
*   **核心库**:
    *   `puppeteer`: 用于图片爬虫
    *   `sharp`: 用于本地图片处理 (去背/裁剪)
    *   `@google/genai`: 用于接入 Google Gemini AI 生成图片
    *   `jsonwebtoken`: 用于用户认证

---

## ✨ 功能特性

1.  **图片库管理 (Image Library)**
    *   图片上传、删除、预览。
    *   **热门标签**: 自动统计 Top 20 标签，支持快速筛选。
    *   **高级筛选**: 支持按标签、日期范围筛选图片。

2.  **图片爬虫 (Crawler)**
    *   基于 Puppeteer 的无头浏览器爬虫。
    *   支持输入关键词（如 "iphone case"）自动抓取 Google 图片。
    *   自动提取图片尺寸并打上来源标签。

3.  **图片处理 (Processing)**
    *   **去背景**: 自动移除图片背景。
    *   **场景生成**: 为产品图添加虚拟背景（Studio, Outdoor 等）。
    *   **尺寸调整**: 批量或单张调整图片宽高。
    *   **加边框**: 自定义边框颜色和宽度。

4.  **AI 图片生成 (AI Generation)**
    *   集成 Google Gemini Flash Image 模型。
    *   **批量生成**: 支持前缀/后缀 + 多行中间关键词的批量生成模式。
    *   **图生图**: 支持上传参考图进行生成。
    *   自动保存并打上 AI 标签。

5.  **系统设置**
    *   动态配置 Google Gemini API Key。

---

## 🏁 快速开始

### 1. 环境准备
*   Node.js (v16+)
*   MySQL (v5.7+)
*   Google Gemini API Key (可选，用于 AI 功能)

### 2. 后端启动
```bash
cd backend
# 安装依赖
npm install
# 配置 .env 文件 (参考下方配置)
# 启动服务 (默认端口 3005)
npm run dev
```

### 3. 前端启动
```bash
cd frontend
# 安装依赖
npm install
# 启动服务 (默认端口 3001)
npm run dev
```

### 4. 环境变量配置 (`backend/.env`)
```env
NODE_ENV=development
PORT=3005
# 数据库
DB_HOST=101.42.235.113
DB_USER=pictures
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=pictures
# 安全
JWT_SECRET=complex_secret_key
# AI 配置
GEMINI_API_KEY=AIzaSy...
```

---

## 📂 项目结构

```text
product-images-manager/
├── backend/                # Node.js 后端
│   ├── src/
│   │   ├── controllers/    # 业务逻辑 (Auth, Image, Crawler, AI)
│   │   ├── models/         # Sequelize 数据模型
│   │   ├── services/       # 核心服务 (爬虫, 图片处理, GenAI)
│   │   └── routes/         # API 路由
│   └── uploads/            # 本地图片存储
│
└── frontend/               # React 前端
    ├── src/
    │   ├── api/            # Axios 请求封装
    │   ├── pages/          # 页面组件 (Crawler, Processing, AI)
    │   └── components/     # 公共组件
    └── vite.config.js      # Vite 配置
```

---

## 💾 数据库设计

**数据库名**: `pictures`

### 1. Users (用户表)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT | 主键 |
| email | VARCHAR | 登录邮箱 |
| password | VARCHAR | 加密密码 |

### 2. Images (图片表)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT | 主键 |
| user_id | INT | 关联用户 |
| filename | VARCHAR | 文件名 |
| path | VARCHAR | 存储路径 |
| source | VARCHAR | 来源 (upload/crawler/ai) |
| width/height | INT | 图片尺寸 |

### 3. Tags (标签表)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | INT | 主键 |
| name | VARCHAR | 标签名 (如: "AI生成", "去背景") |

---

## 🔌 API 概览

| 模块 | 方法 | 路径 | 描述 |
| :--- | :--- | :--- | :--- |
| **Auth** | POST | `/api/v1/auth/login` | 用户登录 |
| **Crawler** | POST | `/api/v1/crawler/crawl` | 爬取图片 |
| **AI** | POST | `/api/v1/ai/generate` | AI 生成图片 |
| **Process** | POST | `/api/v1/image-processing/remove-bg` | 图片去背景 |
| **Tags** | GET | `/api/v1/tags/top` | 获取热门标签 |
