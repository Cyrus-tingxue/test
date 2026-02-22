"""Office AI Mate — 配置与常量"""

# 模型提供者列表（用于侧边栏选择）
PROVIDERS: list[str] = [
    "OpenAI",
    "Anthropic",
    "Google",
    "SiliconCloud",
    "OpenRouter",
]

# 各提供者的模型输入占位提示
PROVIDER_PLACEHOLDER: dict[str, str] = {
    "OpenAI": "例如: gpt-4o",
    "Anthropic": "例如: claude-sonnet-4-20250514",
    "Google": "例如: gemini-2.0-flash",
    "SiliconCloud": "例如: Qwen/Qwen2.5-72B-Instruct",
    "OpenRouter": "例如: google/gemini-2.0-flash-exp:free",
}

# LiteLLM 使用的环境变量名称映射
PROVIDER_ENV_KEY: dict[str, str] = {
    "OpenAI": "OPENAI_API_KEY",
    "Anthropic": "ANTHROPIC_API_KEY",
    "Google": "GEMINI_API_KEY",
    "SiliconCloud": "OPENAI_API_KEY",
    "OpenRouter": "OPENAI_API_KEY",
}

# 需要自定义 Base URL 的提供者（OpenAI 兼容接口）
PROVIDER_BASE_URL: dict[str, str] = {
    "SiliconCloud": "https://api.siliconflow.cn/v1",
    "OpenRouter": "https://openrouter.ai/api/v1",
}

# LiteLLM 模型名前缀（原生支持的 provider 需要特定前缀）
PROVIDER_MODEL_PREFIX: dict[str, str] = {
    "Google": "gemini/",
}

# ── Prompt 模板 ──────────────────────────────────────────────
TASK_PROMPTS: dict[str, str] = {
    "summarize": (
        "你是一位专业的文档分析助手。请阅读以下文档内容，给出一份**结构化摘要**。\n"
        "要求：\n"
        "1. 先用一句话概括文档主旨\n"
        "2. 再分要点列出关键信息\n"
        "3. 语言简洁、重点突出\n\n"
        "---\n\n{document}"
    ),
    "draft_reply": (
        "你是一位专业的商务写作助手。请阅读以下文档内容，"
        "为其撰写一封**专业、礼貌的回复草稿**。\n"
        "要求：\n"
        "1. 信件格式完整（称呼、正文、结尾）\n"
        "2. 针对文档中的关键点逐一回应\n"
        "3. 语气正式但友好\n\n"
        "---\n\n{document}"
    ),
    "extract_actions": (
        "你是一位项目管理助手。请阅读以下文档内容，"
        "提取其中所有的**行动项 / 待办事项 / 数据要点**。\n"
        "要求：\n"
        "1. 使用编号列表输出\n"
        "2. 每条包含：具体行动、责任人（如有）、截止日期（如有）\n"
        "3. 如果无明确行动项，则提取文档中的关键数据\n\n"
        "---\n\n{document}"
    ),
}

CHAT_SYSTEM_PROMPT = (
    "你是 Office AI Mate，一个智能办公助手。用户已上传工作文档，"
    "你需要基于文档内容回答用户的问题。回答要准确、简洁。\n\n"
    "以下是用户上传的文档内容：\n\n{document}"
)

# ── 创作工坊 ─────────────────────────────────────────────────
# 每个任务定义: label, icon, fields(表单字段), prompt(模板)
CREATIVE_TASKS: list[dict] = [
    {
        "key": "weekly_report",
        "label": "周报/日报",
        "icon": "📊",
        "fields": [
            {"name": "report_type", "type": "select", "label": "报告类型",
             "options": ["周报", "日报", "月报"]},
            {"name": "points", "type": "textarea", "label": "工作要点（每行一条）",
             "placeholder": "完成用户模块开发\n修复3个线上BUG\n参加产品需求评审会议"},
            {"name": "tone", "type": "select", "label": "风格",
             "options": ["正式严谨", "简洁干练", "轻松活泼"]},
        ],
        "prompt": (
            "你是一位资深职场写作专家。请根据以下工作要点，生成一份专业的{report_type}。\n"
            "风格要求：{tone}\n"
            "格式要求：\n"
            "1. 包含「本期工作总结」和「下期工作计划」两部分\n"
            "2. 工作总结需按项目/模块分类，每项说明进度和成果\n"
            "3. 语言专业、数据具体、成果量化\n\n"
            "工作要点：\n{points}"
        ),
    },
    {
        "key": "official_doc",
        "label": "公文/报告",
        "icon": "📋",
        "fields": [
            {"name": "doc_type", "type": "select", "label": "文档类型",
             "options": ["工作总结", "项目方案", "通知公告", "会议纪要", "述职报告", "调研报告"]},
            {"name": "topic", "type": "text", "label": "主题/标题",
             "placeholder": "2026年Q1部门工作总结"},
            {"name": "details", "type": "textarea", "label": "核心内容要点",
             "placeholder": "主要成果、关键数据、存在问题等"},
        ],
        "prompt": (
            "你是一位资深公文写作专家。请撰写一份{doc_type}。\n"
            "主题：{topic}\n"
            "要求：\n"
            "1. 符合中文公文写作规范\n"
            "2. 结构完整、逻辑清晰\n"
            "3. 语言正式、用词准确\n"
            "4. 适当使用数据支撑\n\n"
            "核心要点：\n{details}"
        ),
    },
    {
        "key": "email",
        "label": "商务邮件",
        "icon": "✉️",
        "fields": [
            {"name": "language", "type": "select", "label": "语言",
             "options": ["中文", "英文", "中英双语"]},
            {"name": "purpose", "type": "text", "label": "邮件目的",
             "placeholder": "请求延期交付、感谢合作、安排会议…"},
            {"name": "context", "type": "textarea", "label": "补充信息",
             "placeholder": "收件人身份、背景说明、关键要求等"},
            {"name": "email_tone", "type": "select", "label": "语气",
             "options": ["正式礼貌", "友好亲切", "简洁直接", "委婉含蓄"]},
        ],
        "prompt": (
            "你是一位专业的商务沟通顾问。请用{language}撰写一封商务邮件。\n"
            "目的：{purpose}\n"
            "语气：{email_tone}\n"
            "要求：\n"
            "1. 格式完整（称呼、正文、结尾敬语、署名占位）\n"
            "2. 主题行简洁有力\n"
            "3. 正文条理清晰、重点突出\n\n"
            "补充信息：\n{context}"
        ),
    },
    {
        "key": "translate",
        "label": "翻译润色",
        "icon": "🌐",
        "fields": [
            {"name": "direction", "type": "select", "label": "任务类型",
             "options": ["中→英翻译", "英→中翻译", "中文润色", "英文润色"]},
            {"name": "style", "type": "select", "label": "目标风格",
             "options": ["商务正式", "学术严谨", "科技文档", "日常通顺", "文艺优美"]},
            {"name": "source_text", "type": "textarea", "label": "原文",
             "placeholder": "粘贴需要翻译或润色的文本…"},
        ],
        "prompt": (
            "你是一位资深翻译和文字润色专家。\n"
            "任务：{direction}\n"
            "目标风格：{style}\n"
            "要求：\n"
            "1. 译文/润色后的文字自然流畅、地道准确\n"
            "2. 保留原文核心意思，不遗漏关键信息\n"
            "3. 避免机翻痕迹和中式英语\n"
            "4. 输出格式：先给出最终结果，再简要说明修改要点\n\n"
            "原文：\n{source_text}"
        ),
    },
    {
        "key": "ppt_outline",
        "label": "PPT 大纲",
        "icon": "📑",
        "fields": [
            {"name": "ppt_topic", "type": "text", "label": "演示主题",
             "placeholder": "AI赋能企业数字化转型"},
            {"name": "audience", "type": "text", "label": "目标受众",
             "placeholder": "公司高管、客户、团队成员…"},
            {"name": "slides_count", "type": "select", "label": "页数范围",
             "options": ["8-10页（简短）", "12-15页（标准）", "18-20页（详细）"]},
            {"name": "ppt_notes", "type": "textarea", "label": "内容要点（可选）",
             "placeholder": "希望涵盖的关键内容…"},
        ],
        "prompt": (
            "你是一位资深演示文稿策划师。请为以下主题生成 PPT 大纲。\n"
            "主题：{ppt_topic}\n"
            "受众：{audience}\n"
            "页数：{slides_count}\n"
            "要求：\n"
            "1. 每页给出标题、3-4个要点、演讲备注提示\n"
            "2. 结构遵循：开场引入 → 问题/现状 → 方案/亮点 → 案例/数据 → 总结/行动号召\n"
            "3. 每页标注建议的视觉元素（图表、图片、数据可视化）\n\n"
            "补充要点：\n{ppt_notes}"
        ),
    },
    {
        "key": "brainstorm",
        "label": "头脑风暴",
        "icon": "💡",
        "fields": [
            {"name": "challenge", "type": "text", "label": "问题/主题",
             "placeholder": "如何提升团队会议效率？"},
            {"name": "constraints", "type": "textarea", "label": "约束条件（可选）",
             "placeholder": "预算有限、远程团队、需在一个月内落地…"},
            {"name": "idea_count", "type": "select", "label": "创意数量",
             "options": ["5个快速创意", "10个深度创意", "20个发散创意"]},
        ],
        "prompt": (
            "你是一位创意策划大师和创新思维教练。请围绕以下主题进行头脑风暴。\n"
            "主题：{challenge}\n"
            "创意数量：{idea_count}\n"
            "要求：\n"
            "1. 每个创意需包含：标题、简述、可行性评估（高/中/低）\n"
            "2. 创意要多元化：包含常规方案和突破性方案\n"
            "3. 至少 2 个创意要跳出传统思维框架\n"
            "4. 最后给出 Top 3 推荐及理由\n\n"
            "约束条件：\n{constraints}"
        ),
    },
]

# ── 导航配置 ─────────────────────────────────────────────────
NAV_GROUPS: list[dict] = [
    {
        "group": None,  # 无分组标签（首页独立）
        "items": [
            {"key": "home", "icon": "🏠", "label": "首页"},
        ],
    },
    {
        "group": "智能办公",
        "items": [
            {"key": "creative", "icon": "✨", "label": "创作工坊"},
            {"key": "doc_workspace", "icon": "📄", "label": "文档工作台"},
        ],
    },
    {
        "group": "AI 工具",
        "items": [
            {"key": "free_chat", "icon": "🧠", "label": "AI 对话"},
            {"key": "code", "icon": "🖥️", "label": "代码助手"},
            {"key": "search", "icon": "🔍", "label": "AI 搜索"},
            {"key": "image", "icon": "🎨", "label": "AI 绘图"},
        ],
    },
    {
        "group": "实用工具",
        "items": [
            {"key": "viz", "icon": "📊", "label": "数据可视化"},
            {"key": "mindmap", "icon": "🧠", "label": "思维导图"},
            {"key": "markdown", "icon": "📝", "label": "Markdown 编辑器"},
            {"key": "tools", "icon": "🔧", "label": "实用工具箱"},
        ],
    },
]

# 扁平化导航项列表（供快速查找）
NAV_ALL_ITEMS: list[dict] = []
for _g in NAV_GROUPS:
    NAV_ALL_ITEMS.extend(_g["items"])
