# BookShelf — 本地电子书管理工具

![macOS](https://img.shields.io/badge/platform-macOS-blue)
![Tauri](https://img.shields.io/badge/Tauri-2.x-purple)
![Rust](https://img.shields.io/badge/Rust-stable-orange)

BookShelf 是一款面向 macOS 的本地电子书管理工具，帮你把散落在硬盘各处的 EPUB / PDF 书籍整理成有序的个人书架。支持标签分类、搜索、评分标注、自定义封面等特性，所有数据存储在本地，无需联网。

<p align="center">
  <img src="docs/screenshot.png" alt="BookShelf 截图" width="720" />
</p>

## ✨ 功能一览

### 📚 图书管理
- **扫描导入** — 选择目录，自动扫描其中的 `.epub` / `.pdf` 文件，提取书名、作者、封面、文件大小等信息
- **网格 / 列表视图** — 两种浏览模式自由切换
- **封面管理** — 点击封面可自定义更换图片（支持 png/jpg/jpeg/webp/gif）

### 🏷️ 标签管理
- **创建标签** — 支持命名和颜色标记
- **批量打标** — 选中多本书，一键添加/移除标签
- **标签过滤** — 点击侧栏标签快速筛选图书

### 🔍 搜索
- **全文搜索** — 按书名、作者关键词搜索（基于 SQLite FTS5）
- **标签 + 关键字联合筛选**

### ⭐ 个人标注
- **评分** — 1~5 星评分
- **已读标记** — 标记是否已读完
- **喜欢** — 标记喜爱的图书
- **备注** — 自由添加文字备注
- **笔记链接** — 关联外部笔记（支持 URL 或本地路径）

### 🖱️ 便捷操作
- **双击打开** — 用系统默认应用打开图书
- **Finder 中显示** — 快速定位文件
- **批量操作** — 多选模式支持批量删除、批量打标
- **右键菜单** — 快捷操作入口

## 待实现的功能
- 打开图书的功能
- 修改图书封面

## 🛠️ 技术栈

| 层 | 选型 |
|---|---|
| 桌面框架 | [Tauri 2.x](https://v2.tauri.app) |
| 后端语言 | Rust |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 数据库 | SQLite（via `rusqlite`） |
| EPUB 解析 | `epub` crate + 手动 OPF 解析 |
| PDF 解析 | `lopdf` |

## 📦 安装

### 下载预构建 DMG
从 [Releases](https://github.com/your-username/book-shelf/releases) 页面下载最新版本的 `.dmg` 安装包，挂载后拖入 Applications 文件夹即可。

> 最低系统版本：macOS 10.15 (Catalina)

### 从源码构建

#### 前置依赖

- [Rust](https://www.rust-lang.org/tools/install)（stable）
- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/)

#### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/book-shelf.git
cd book-shelf

# 2. 安装前端依赖
pnpm install

# 3. 开发模式（热更新）
pnpm tauri dev

# 4. 构建发布版 DMG
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/bundle/dmg/`。

#### 仅运行前端开发服务器

```bash
pnpm dev
```

前端开发服务器默认运行在 `http://localhost:5173`，后端需通过 `pnpm tauri dev` 启动。

## 📁 项目结构

```
book-shelf/
├── src/                          # React 前端
│   ├── api/                      # Tauri invoke 封装层
│   ├── components/               # UI 组件
│   │   ├── BookCard.tsx          # 图书卡片（网格视图）
│   │   ├── BookGrid.tsx          # 图书列表/网格容器
│   │   ├── BookDetail.tsx        # 图书详情面板
│   │   ├── Sidebar.tsx           # 标签侧栏
│   │   ├── BulkActionBar.tsx     # 批量操作栏
│   │   ├── ScanDialog.tsx        # 扫描弹窗
│   │   ├── TagManager.tsx        # 标签管理弹窗
│   │   └── Tooltip.tsx           # 自定义提示组件
│   ├── pages/
│   │   └── Home.tsx              # 主页面
│   ├── store/                    # Zustand 状态管理
│   └── hooks/
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── commands/             # Tauri 命令入口
│   │   ├── services/             # 业务逻辑
│   │   │   ├── scanner.rs        # 目录扫描
│   │   │   ├── metadata.rs       # 元数据提取
│   │   │   ├── repository.rs     # 数据库操作
│   │   │   └── search.rs         # 搜索服务
│   │   ├── db/                   # 数据库初始化与迁移
│   │   └── models.rs             # 数据模型
│   ├── icons/                    # 应用图标
│   └── tauri.conf.json           # Tauri 配置
├── docs/
│   └── dev.md                    # 开发设计文档
├── package.json
└── README.md
```

## ⚙️ 开发相关

```bash
# 仅构建前端
pnpm build

# Rust 静态检查
cd src-tauri && cargo check

# 运行 Rust 测试
cd src-tauri && cargo test
```

## 🔐 隐私说明

- 所有数据存储在本地 SQLite 数据库中
- 不会上传任何图书文件或个人信息
- 封面图片缓存在应用数据目录下
- 无需网络连接即可使用全部功能

## 📄 许可证

[MIT](LICENSE)
