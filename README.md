# Office AI Mate (v2.0)
> **作者：昨夜提灯看雪**

Office AI Mate 是一个功能全面的 **AI 驱动办公助手**，基于 **FastAPI** (后端) 和 **原生 HTML/JS/CSS** (前端) 构建。

它拥有现代化的响应式 **暗黑模式 UI**，集成了深度搜索、文档处理和创意写作工具。

## 🚀 功能概览

*   **🧠 AI 对话**: 通过 OpenRouter 支持多模型 (OpenAI, Claude, Gemini 等)。
*   **🔍 AI 搜索**: 智能网页搜索，具备查询优化和自动摘要功能。
*   **✨ 创意工坊**: 使用专业模板生成报告、邮件和翻译。
*   **🖥️ 代码助手**: 调试、解释和生成多种语言的代码。
*   **📊 数据可视化**: 将 CSV/Excel 文件转化为交互式图表。
*   **🧠 思维导图**: 从简单的主题生成结构化图表。

## 🛠️ 安装指南

### 1. 前置要求
*   安装 Python 3.8 或更高版本。
*   互联网连接 (用于 AI API 调用)。

### 2. 安装依赖
在项目文件夹中打开终端并运行：
```bash
pip install -r requirements.txt
```

*(核心库: `fastapi`, `uvicorn`, `litellm`, `duckduckgo-search`, `pdf2docx`)*

## ▶️ 使用方法

### 方式 A: 快速启动 (Windows)
双击 **`start.bat`** 文件。

### 方式 B: 手动启动
在终端中运行以下命令：
```bash
python api_server.py
```

### 访问应用
服务器启动后，在浏览器中打开：
👉 **[http://localhost:8000](http://localhost:8000)**

## ⚙️ 配置说明

1.  点击左下角侧边栏的 **配置 (⚙️)** 按钮。
2.  输入您的 **API Key** (例如 OpenRouter Key)。
3.  选择您偏好的 **模型**。
4.  点击 **保存**。设置将本地存储在您的浏览器中。

---
*由 FastAPI & LiteLLM 强力驱动*
