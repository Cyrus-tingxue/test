// 全局标记：服务器是否配置了默认 API Key
window._hasDefaultKey = false;

// 安全解析 JSON 响应，避免空响应导致 "Unexpected end of JSON input"
async function safeJson(response) {
    const text = await response.text();
    if (!text || !text.trim()) {
        throw new Error(`服务器返回空响应 (HTTP ${response.status})`);
    }
    try {
        return JSON.parse(text);
    } catch (e) {
        throw new Error(`服务器返回非JSON内容: ${text.substring(0, 200)}`);
    }
}

const NAV_CONFIG = [
    {
        group: null,
        items: [
            { key: 'home', label: '首页', icon: 'home' }
        ]
    },
    {
        group: 'AI 工具',
        items: [
            { key: 'free_chat', label: 'AI 对话', icon: 'message-circle' },
            { key: 'clone', label: 'AI 角色克隆', icon: 'user-plus' },
            { key: 'search', label: 'AI 搜索', icon: 'search' },
            { key: 'code', label: '代码助手', icon: 'code' }
        ]
    },
    {
        group: '智能办公',
        items: [
            { key: 'creative', label: '创作工坊', icon: 'sparkles' },
            { key: 'excel', label: 'Excel 助手', icon: 'table' },
            { key: 'converter', label: '格式转换', icon: 'refresh-cw' },
            { key: 'viz', label: '数据可视化', icon: 'bar-chart-2' },
            { key: 'mindmap', label: '思维导图', icon: 'brain-circuit' },
            { key: 'ppt', label: 'AI PPT', icon: 'presentation' }
        ]
    },
    {
        group: '摸鱼专区',
        items: [
            { key: 'game', label: '文字冒险', icon: 'gamepad-2' }
        ]
    }
];

// Toggle Sidebar (mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isOpen = sidebar.classList.toggle('sidebar-open');
    if (isOpen) {
        overlay.style.display = 'block';
        requestAnimationFrame(() => overlay.classList.add('active'));
    } else {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }
}

// Initialize App (use 'load' to ensure all deferred scripts are ready)
window.addEventListener('load', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    renderSidebar();
    loadPage('home'); // Default page
    loadSettings();
});

// Sidebar Renderer
function renderSidebar() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.innerHTML = '';

    NAV_CONFIG.forEach(group => {
        if (group.group) {
            const label = document.createElement('div');
            label.className = 'nav-group-label';
            label.textContent = group.group;
            navMenu.appendChild(label);
        }

        group.items.forEach(item => {
            const btn = document.createElement('div');
            btn.className = 'nav-item';
            btn.dataset.key = item.key;
            btn.innerHTML = `<i data-lucide="${item.icon}"></i> ${item.label}`;
            btn.onclick = () => {
                loadPage(item.key);
                // Auto-close sidebar on mobile
                if (window.innerWidth <= 768) {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar.classList.contains('sidebar-open')) toggleSidebar();
                }
            };
            navMenu.appendChild(btn);
        });
    });
    lucide.createIcons();
}

// Page Loader
function loadPage(pageKey) {
    // 1. Update Active State
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-item[data-key="${pageKey}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // 2. Update Header
    const pageItem = NAV_CONFIG.flatMap(g => g.items).find(i => i.key === pageKey);
    document.getElementById('page-title').textContent = pageItem ? pageItem.label : '未知页面';

    // 3. Render Content (Router)
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = ''; // Clear current content

    if (pageKey === 'home') renderHome(contentArea);
    else if (pageKey === 'search') renderSearch(contentArea);
    else if (pageKey === 'free_chat') renderChat(contentArea);
    else if (pageKey === 'converter') renderConverter(contentArea);
    else if (pageKey === 'creative') renderCreative(contentArea);
    else if (pageKey === 'excel') renderExcel(contentArea);
    else if (pageKey === 'viz') renderViz(contentArea);
    else if (pageKey === 'mindmap') renderMindMap(contentArea);
    else if (pageKey === 'ppt') renderPPT(contentArea);
    else if (pageKey === 'code') renderCode(contentArea);
    else if (pageKey === 'clone') renderClone(contentArea);
    else if (pageKey === 'game') renderGame(contentArea);
    else if (pageKey === 'markdown') renderMarkdown(contentArea);
    else if (pageKey === 'system') renderSystem(contentArea);
    else {
        contentArea.innerHTML = `<div class="card"><h3>🏗️ ${pageItem.label} 正在开发中...</h3><p>此功能正在从 Python 迁移到 JavaScript 前端。</p></div>`;
    }
}

// --- Page Renderers ---

function renderHome(container) {
    const features = [
        { key: 'free_chat', icon: '💬', title: 'AI 对话', desc: '与AI自由对话，获取即时解答', tag: 'AI', tagClass: 'tag-ai' },
        { key: 'clone', icon: '🎭', title: 'AI 角色克隆', desc: '上传聊天记录，定制专属 AI 数字分身', tag: 'AI', tagClass: 'tag-ai' },
        { key: 'search', icon: '🔍', title: 'AI 搜索', desc: '联网搜索+AI总结，快速获取准确信息', tag: 'AI', tagClass: 'tag-ai' },
        { key: 'code', icon: '💻', title: '代码助手', desc: '支持15+语言的代码生成、审查与调试', tag: 'AI', tagClass: 'tag-ai' },
        { key: 'creative', icon: '✨', title: '创作工坊', desc: '日报周报、文案、简历、合同审查等20+模板', tag: '智能办公', tagClass: 'tag-tool' },
        { key: 'excel', icon: '📊', title: 'Excel 助手', desc: 'AI 自动处理 Excel 数据，支持清洗、统计、拆分', tag: '智能办公', tagClass: 'tag-tool' },
        { key: 'ppt', icon: '📽️', title: 'AI PPT', desc: '一键生成 PPT 大纲与文件', tag: '智能办公', tagClass: 'tag-tool' },
        { key: 'converter', icon: '📑', title: '智能格式转换', desc: 'PDF/图片转Excel、Word、PDF等', tag: '智能办公', tagClass: 'tag-tool' },
        { key: 'mindmap', icon: '🧠', title: '思维导图', desc: 'AI自动生成结构化思维导图', tag: '智能办公', tagClass: 'tag-tool' },
        { key: 'viz', icon: '📊', title: '数据可视化', desc: '上传表格数据，自动生成图表', tag: '智能办公', tagClass: 'tag-tool' },
    ];

    container.innerHTML = `
        <div class="hero-section">
            <h1>Office AI Mate</h1>
            <p class="subtitle">AI 驱动的全能办公助手 · 昨夜提灯看雪 开发</p>
            <div class="hero-stats">
                <div class="hero-stat"><div class="num">${features.length}</div><div class="label">功能模块</div></div>
                <div class="hero-stat"><div class="num">20+</div><div class="label">创作模板</div></div>
                <div class="hero-stat"><div class="num">15+</div><div class="label">编程语言</div></div>
            </div>
        </div>
        <div class="feature-grid">
            ${features.map((f, i) => `
                <div class="feature-card" onclick="loadPage('${f.key}')" style="animation-delay: ${i * 0.05}s">
                    <span class="icon">${f.icon}</span>
                    <h4>${f.title}</h4>
                    <p>${f.desc}</p>
                    <span class="tag ${f.tagClass}">${f.tag}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderSearch(container) {
    container.innerHTML = `
        <div class="card">
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <input type="text" id="search-input" placeholder="输入搜索问题..." class="modal-body" style="flex: 1; padding: 0.8rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--bg-darker); color: white;" onkeydown="if(event.key === 'Enter') doSearch()">
                <button onclick="doSearch()" class="primary-btn" style="width: auto;">🔍 搜索</button>
            </div>
            
            <div id="search-status" style="margin-bottom: 1rem; color: var(--text-muted); font-size: 0.9rem;"></div>
            
            <div id="ai-summary-card" style="display: none; background: var(--bg-darker); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin-top: 0; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="sparkles" style="color: #a5b4fc;"></i> AI 智能总结</h4>
                <div id="ai-summary-content" style="line-height: 1.6; color: #e2e8f0;"></div>
            </div>

            <div id="search-results"></div>

            <div id="load-more-container" style="text-align: center; margin-top: 1.5rem; display: none;">
                <button onclick="doLoadMore()" class="primary-btn" style="background: var(--bg-darker); border: 1px solid var(--border); width: auto;">👇 加载更多</button>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderChat(container) {
    container.innerHTML = `
        <div class="card" style="display: flex; flex-direction: column; height: 100%; box-sizing: border-box;">
            <div id="chat-history" style="flex: 1; overflow-y: auto; margin-bottom: 1rem; padding-right: 0.5rem;">
                <div style="text-align: center; color: var(--text-muted); padding-top: 2rem;">
                    <i data-lucide="message-circle" style="width: 48px; height: 48px; opacity: 0.5;"></i>
                    <p>和满血大模型自由对话</p>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="chat-input" placeholder="随便聊点什么..." 
                    style="flex: 1; padding: 0.8rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--bg-darker); color: white;"
                    onkeydown="if(event.key === 'Enter') doChat()">
                <button onclick="doChat()" class="primary-btn" style="width: auto;"><i data-lucide="send"></i></button>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderConverter(container) {
    container.innerHTML = `
        <div class="card">
            <h3>📑 智能格式转换</h3>
            <div style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.5rem;">
                <button class="nav-item active" onclick="switchConvertTab(this, 'pdf2word')">PDF 转 Word</button>
                <button class="nav-item" onclick="switchConvertTab(this, 'img2pdf')">图片 转 PDF</button>
                <button class="nav-item" onclick="switchConvertTab(this, 'pdf2excel')">PDF 转 Excel</button>
                <button class="nav-item" onclick="switchConvertTab(this, 'img2excel')">图片 转 Excel</button>
            </div>
            
            <div id="convert-area">
                <!-- PDF to Word -->
                <div id="pdf2word-panel">
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">上传 PDF 文件，保留原格式转换为 Word 文档。</p>
                    <input type="file" id="p2w-file" accept=".pdf" style="margin-bottom: 1rem;">
                    <button onclick="doPdfToWord()" class="primary-btn">开始转换</button>
                    <div id="p2w-status" style="margin-top: 1rem;"></div>
                </div>
                
                <!-- Image to PDF -->
                <div id="img2pdf-panel" style="display: none;">
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">上传多张图片，合并为一个 PDF 文档。</p>
                    <input type="file" id="i2p-files" accept="image/*" multiple style="margin-bottom: 1rem;">
                    <button onclick="doImgToPdf()" class="primary-btn">开始转换</button>
                    <div id="i2p-status" style="margin-top: 1rem;"></div>
                </div>

                <!-- PDF to Excel -->
                <div id="pdf2excel-panel" style="display: none;">
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">上传 PDF 文件，提取表格数据到 Excel。</p>
                    <input type="file" id="p2e-file" accept=".pdf" style="margin-bottom: 1rem;">
                    <button onclick="doPdfToExcel()" class="primary-btn">开始转换</button>
                    <div id="p2e-status" style="margin-top: 1rem;"></div>
                </div>

                <!-- Image to Excel -->
                <div id="img2excel-panel" style="display: none;">
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">上传包含表格的图片，识别并导出为 Excel。</p>
                    <input type="file" id="i2e-file" accept="image/*" style="margin-bottom: 1rem;">
                    <button onclick="doImgToExcel()" class="primary-btn">开始转换</button>
                    <div id="i2e-status" style="margin-top: 1rem;"></div>
                </div>
            </div>
        </div>
    `;
}

// --- Infinite Adventure Game ---
let adventureState = null;

const SCENARIOS = [
    {
        id: 'rules_horror',
        name: '规则怪谈',
        desc: '你穿越到了一个充满诡异规则的世界。遵守规则是生存的唯一方式，但规则本身......可能是假的。',
        icon: '🕯️',
        bg: 'linear-gradient(135deg, #000000 0%, #434343 100%)'
    },
    {
        id: 'xiuxian',
        name: '修仙模拟器',
        desc: '凡人修仙，逆天改命。从炼气期开始你的长生之路。',
        icon: '⚔️',
        bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
    },
    {
        id: 'zombie',
        name: '末日生存',
        desc: '丧尸围城，资源匮乏。你不仅要活下去，还要寻找人类最后的希望。',
        icon: '🧟',
        bg: 'linear-gradient(135deg, #3f3f46 0%, #18181b 100%)'
    },
    {
        id: 'cyberpunk',
        name: '夜之城传奇',
        desc: '霓虹闪烁的赛博朋克世界。义体改造、骇客入侵、公司战争。',
        icon: '🌃',
        bg: 'linear-gradient(135deg, #2e1065 0%, #020617 100%)'
    },
    {
        id: 'office',
        name: '职场升职记',
        desc: '开局被裁员，背负巨额房贷。如何在尔虞我诈的职场中逆袭？',
        icon: '💼',
        bg: 'linear-gradient(135deg, #1e1b4b 0%, #020617 100%)'
    }
];

function renderGame(container) {
    // Load state
    const saved = localStorage.getItem('adventure_save_data');
    if (saved) {
        adventureState = JSON.parse(saved);
        renderAdventureUI(container);
    } else {
        renderScenarioSelect(container);
    }
}

function renderScenarioSelect(container) {
    container.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem;">
            <h2 style="margin-bottom: 0.5rem;">🌌 选择你的平行宇宙</h2>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">AI 实时生成的无限文字冒险。每一次选择，都是全新的历史。</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                ${SCENARIOS.map(s => `
                    <div onclick="startAdventure('${s.id}')" style="background: ${s.bg}; border: 1px solid var(--border); border-radius: 1rem; padding: 1.5rem; cursor: pointer; transition: transform 0.2s; text-align: left; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='none'">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">${s.icon}</div>
                        <h3 style="margin-bottom: 0.5rem; color: white;">${s.name}</h3>
                        <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6;">${s.desc}</p>
                        <div style="position: absolute; bottom: 1rem; right: 1rem; opacity: 0.2; font-size: 5rem;">${s.icon}</div>
                    </div>
                `).join('')}
            </div>
            
             <div style="margin-top: 2rem; color: var(--text-muted); font-size: 0.8rem;">
                ⚠️ 提示：所有剧情均由 AI 实时生成，请勿输入个人隐私信息。
            </div>
        </div>
    `;
}

async function startAdventure(scenarioId) {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);

    // Init State
    adventureState = {
        setting: scenario.name + " - " + scenario.desc,
        hp: 100,
        max_hp: 100,
        inventory: ["新手礼包"],
        location: "起始之地",
        status: "健康",
        history: [],
        messages: [] // UI Display messages
    };

    // Initial prompt
    await adventureAction(`我醒来了。这里是哪里？(背景：${scenario.name})`);
}

function renderAdventureUI(container) {
    container.innerHTML = `
        <div style="display: grid; grid-template-rows: auto 1fr auto; height: calc(100vh - 140px); gap: 1rem;">
            <!-- Status Bar -->
            <div class="card adv-status-bar" style="padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px);">
                <div style="display: flex; gap: 1.5rem; align-items: center; font-size: 1.1rem;">
                    <span style="font-weight: bold; color: #f43f5e;">❤️ HP: ${adventureState.hp}/${adventureState.max_hp}</span>
                    <span style="color: #3b82f6;">📍 ${adventureState.location}</span>
                    <span style="color: #eab308;">📦 ${adventureState.inventory.join(', ') || '空'}</span>
                </div>
                <div>
                     <span style="color: var(--text-muted); font-size: 1rem;">${adventureState.status}</span>
                     <button onclick="resetAdventure()" style="margin-left: 1rem; background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.9rem;">🔄 重开</button>
                </div>
            </div>

            <!-- Log Area -->
            <div id="adv-log" class="card" style="overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; background: rgba(15, 23, 42, 0.6); font-size: 1.15rem;">
                ${adventureState.messages.map(msg => `
                    <div style="animation: fadeIn 0.5s; opacity: 1;">
                        ${msg.role === 'user'
            ? `<div style="color: var(--primary); font-weight: bold; margin-bottom: 0.5rem;">> ${msg.content}</div>`
            : `<div style="line-height: 1.8; color: #e2e8f0; white-space: pre-wrap;">${msg.content}</div>`
        }
                    </div>
                `).join('')}
                <div id="adv-loading" style="display: none; color: var(--text-muted);">
                    <span class="loading-spinner"></span> DM 正在思考命运的走向...
                </div>
            </div>

            <!-- Input Area -->
            <div class="card" style="padding: 1.2rem;">
                <div id="adv-choices" style="display: flex; gap: 0.8rem; margin-bottom: 1rem; overflow-x: auto; padding-bottom: 0.5rem;">
                    <!-- Choices injected here -->
                </div>
                
                <div style="display: flex; gap: 0.8rem;">
                    <input type="text" id="adv-input" placeholder="你想做什么？(例如：向北走、检查背包、攻击史莱姆)..." 
                        style="flex: 1; padding: 1.2rem; font-size: 1.1rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--bg-darker); color: white;"
                        onkeydown="if(event.key === 'Enter') adventureAction(this.value)">
                    <button onclick="adventureAction(document.getElementById('adv-input').value)" class="primary-btn" style="width: auto; padding: 0 2rem; font-size: 1.2rem;"><i data-lucide="send"></i></button>
                </div>
            </div>
        </div>
    `;

    // Auto scroll & Rendering Choices
    const logEl = document.getElementById('adv-log');
    logEl.scrollTop = logEl.scrollHeight;

    const choicesEl = document.getElementById('adv-choices');
    if (adventureState.last_choices && adventureState.last_choices.length > 0) {
        choicesEl.innerHTML = adventureState.last_choices.map(c =>
            `<button onclick="adventureAction('${c}')" class="primary-btn" style="background: var(--bg-darker); border: 1px solid var(--primary); color: var(--primary); white-space: nowrap;">${c}</button>`
        ).join('');
    } else {
        choicesEl.style.display = 'none';
    }
}

async function adventureAction(actionText) {
    if (!actionText || !adventureState) return;

    const inputEl = document.getElementById('adv-input');
    if (inputEl) inputEl.value = '';

    // Optimistic UI
    adventureState.messages.push({ role: 'user', content: actionText });
    renderAdventureUI(document.getElementById('content-area'));

    const apiKey = document.getElementById('apikey-input').value;
    if (!apiKey && !window._hasDefaultKey) {
        adventureState.messages.push({ role: 'assistant', content: "⚠️ 请先在左侧菜单「设置」中配置 API Key" });
        renderAdventureUI(document.getElementById('content-area'));
        return;
    }

    document.getElementById('adv-loading').style.display = 'block';

    try {
        const response = await fetch('/api/game/adventure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                world_setting: adventureState.setting,
                current_state: {
                    hp: adventureState.hp,
                    max_hp: adventureState.max_hp,
                    inventory: adventureState.inventory,
                    location: adventureState.location,
                    status: adventureState.status
                },
                history: adventureState.history,
                user_action: actionText,
                provider: document.getElementById('provider-select').value,
                model: document.getElementById('model-input').value,
                api_key: apiKey || '',
                base_url: document.getElementById('baseurl-input').value || null
            })
        });

        const res = await safeJson(response);

        if (!response.ok) {
            let errorMsg = res.detail;
            if (typeof errorMsg === 'object') {
                errorMsg = JSON.stringify(errorMsg);
            }
            throw new Error(errorMsg || "Unknown Server Error");
        }

        // Update State
        const newState = res.state_update || {};
        if (newState.hp !== undefined) adventureState.hp = newState.hp;
        if (newState.inventory) adventureState.inventory = newState.inventory;
        if (newState.location) adventureState.location = newState.location;
        if (newState.status) adventureState.status = newState.status;

        // Update History & Messages
        adventureState.history.push({ role: 'user', content: actionText });
        adventureState.history.push({ role: 'assistant', content: res.plot });
        adventureState.messages.push({ role: 'assistant', content: res.plot });

        adventureState.last_choices = res.choices || [];

        saveAdventureData();
        renderAdventureUI(document.getElementById('content-area'));

    } catch (e) {
        adventureState.messages.push({ role: 'assistant', content: `[系统错误] ${e.message}` });
        renderAdventureUI(document.getElementById('content-area'));
    }
}

function saveAdventureData() {
    if (adventureState) {
        // Limit history for API context, but keep messages for UI
        if (adventureState.history.length > 20) {
            adventureState.history = adventureState.history.slice(adventureState.history.length - 20);
        }
        localStorage.setItem('adventure_save_data', JSON.stringify(adventureState));
    }
}

function resetAdventure() {
    if (confirm("确定要删除当前存档并重开吗？此操作无法撤销。")) {
        localStorage.removeItem('adventure_save_data');
        adventureState = null;
        renderGame(document.getElementById('content-area'));
    }
}

function switchConvertTab(btn, tabId) {
    // Buttons
    btn.parentElement.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Panels
    const panels = ['pdf2word', 'img2pdf', 'pdf2excel', 'img2excel'];
    panels.forEach(p => {
        const el = document.getElementById(p + '-panel');
        if (el) el.style.display = (p === tabId) ? 'block' : 'none';
    });
}


async function doPdfToExcel() {
    const fileInput = document.getElementById('p2e-file');
    const statusDiv = document.getElementById('p2e-status');

    if (fileInput.files.length === 0) {
        alert("请选择文件");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    statusDiv.innerHTML = '<span class="loading-spinner"></span> 正在转换中，请稍候...';

    try {
        const response = await fetch('/api/convert/pdf-to-excel', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name.replace('.pdf', '') + '.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            statusDiv.innerHTML = '✅ 转换成功！文件已下载。';
        } else {
            const err = await safeJson(response);
            statusDiv.innerHTML = `❌ 失败: ${err.detail}`;
        }
    } catch (e) {
        statusDiv.innerHTML = `❌ 网络错误: ${e.message}`;
    }
}

async function doImgToExcel() {
    const fileInput = document.getElementById('i2e-file');
    const statusDiv = document.getElementById('i2e-status');

    if (fileInput.files.length === 0) {
        alert("请选择文件");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    statusDiv.innerHTML = '<span class="loading-spinner"></span> 正在转换中，请稍候...';

    try {
        const response = await fetch('/api/convert/img-to-excel', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name.split('.')[0] + '.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            statusDiv.innerHTML = '✅ 转换成功！文件已下载。';
        } else {
            const err = await safeJson(response);
            statusDiv.innerHTML = `❌ 失败: ${err.detail}`;
        }
    } catch (e) {
        statusDiv.innerHTML = `❌ 网络错误: ${e.message}`;
    }
}

// --- Feature Renders ---

function renderCreative(container) {
    container.innerHTML = `
        <div class="card">
            <h3>✨ 创作工坊</h3>
            <div style="margin-bottom: 1rem;">
                <select id="creative-task" onchange="renderCreativeForm()" style="padding: 0.5rem; border-radius: 0.5rem; background: var(--bg-darker); color: white; border: 1px solid var(--border); width: 100%;">
                    <optgroup label="🏢 职场办公">
                        <option value="daily_report">📅 日报生成</option>
                        <option value="weekly_report">📊 周报生成</option>
                        <option value="email">📧 商务邮件</option>
                        <option value="meeting_minutes">📝 会议纪要整理</option>
                        <option value="excel_gen">📊 Excel 生成</option>
                        <option value="okr_draft">🎯 OKR 起草</option>
                    </optgroup>
                    <optgroup label="🎓 学术教育">
                        <option value="translation">🌍 翻译润色</option>
                        <option value="essay_outline">📑 论文/文章大纲</option>
                        <option value="study_plan">📚 学习计划制定</option>
                    </optgroup>
                    <optgroup label="📱 新媒体运营">
                        <option value="xhs_copy">📕 小红书文案</option>
                        <option value="video_script">🎬 短视频脚本</option>
                    </optgroup>
                    <optgroup label="🏠 生活助手">
                        <option value="recipe_gen">🍳 食材生成菜谱</option>
                        <option value="travel_plan">✈️ 旅行计划</option>
                    </optgroup>
                    <optgroup label="🚀 职场进阶">
                        <option value="resume_polish">📄 简历优化</option>
                        <option value="interview_prep">💼 面试模拟准备</option>
                    </optgroup>
                    <optgroup label="📊 商业分析">
                        <option value="swot_analysis">📈 SWOT 分析</option>
                        <option value="contract_review">⚖️ 合同风险审查</option>
                    </optgroup>
                    <optgroup label="✍️ 写作辅助">
                        <option value="title_gen">🔥 爆款标题生成</option>
                        <option value="article_polish">✒️ 文章润色</option>
                    </optgroup>
                </select>
            </div>
            <div id="creative-form"></div>
            <div id="creative-result" style="margin-top: 1rem; white-space: pre-wrap;"></div>
        </div>
    `;
    renderCreativeForm();
}

function renderCreativeForm() {
    const task = document.getElementById('creative-task').value;
    const formDiv = document.getElementById('creative-form');
    let html = '';

    if (task === 'email') {
        html = `
            <input type="text" id="c-receiver" placeholder="收件人" style="width: 100%; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;">
            <input type="text" id="c-topic" placeholder="主题" style="width: 100%; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;">
            <textarea id="c-content" placeholder="主要内容点..." style="width: 100%; height: 100px; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;"></textarea>
        `;
    } else if (task === 'translation') {
        html = `
            <input type="text" id="c-target-lang" placeholder="目标语言 (如 English, Japanese)" style="width: 100%; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;">
            <textarea id="c-content" placeholder="需要翻译的内容..." style="width: 100%; height: 100px; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;"></textarea>
        `;
    } else if (task === 'study_plan') {
        html = `
            <input type="text" id="c-topic" placeholder="学习科目/技能 (如 Python, 钢琴)" style="width: 100%; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;">
            <input type="text" id="c-time" placeholder="可用时间 (如 3个月, 每天2小时)" style="width: 100%; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;">
        `;
    } else if (task === 'xhs_copy' || task === 'video_script') {
        html = `
            <input type="text" id="c-topic" placeholder="主题/产品名称" style="width: 100%; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;">
            <textarea id="c-content" placeholder="卖点/大概想法..." style="width: 100%; height: 100px; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;"></textarea>
        `;
    } else if (task === 'travel_plan') {
        html = `
            <input type="text" id="c-destination" placeholder="目的地 (如 杭州, 日本)" style="width: 100%; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;">
            <input type="text" id="c-days" placeholder="旅行天数 (如 3天2晚)" style="width: 100%; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;">
        `;
    } else if (task === 'excel_gen') {
        html = `
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">数据描述/需求</label>
                <textarea id="c-content" placeholder="例如：生成一份2026年第一季度销售数据，包含月份、产品、销量、销售额..." style="width: 100%; height: 100px; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white; border-radius: 0.5rem;"></textarea>
            </div>
        `;
    } else {
        // Generic text area for: daily/weekly report, meeting minutes, okr, essay outline, recipe
        let placeholder = "输入内容...";
        if (task === 'meeting_minutes') placeholder = "输入会议纪要草稿/速记...";
        if (task === 'okr_draft') placeholder = "输入你的年度/季度目标...";
        if (task === 'essay_outline') placeholder = "输入论文/文章主题...";
        if (task === 'recipe_gen') placeholder = "输入现有食材...";

        html = `
            <textarea id="c-content" placeholder="${placeholder}" style="width: 100%; height: 150px; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;"></textarea>
        `;
    }

    html += `<button onclick="doCreativeGenerate()" class="primary-btn" style="margin-top: 1rem;">🚀 生成内容</button>`;
    formDiv.innerHTML = html;
}

async function doCreativeGenerate() {
    const task = document.getElementById('creative-task').value;
    const resultDiv = document.getElementById('creative-result');
    const apiKey = document.getElementById('apikey-input').value;

    if (!apiKey && !window._hasDefaultKey) { alert("请先配置 API Key"); return; }

    // Gather fields (All potential inputs)
    let fields = {};
    if (document.getElementById('c-content')) fields.content = document.getElementById('c-content').value;
    if (document.getElementById('c-receiver')) fields.receiver = document.getElementById('c-receiver').value;
    if (document.getElementById('c-topic')) fields.topic = document.getElementById('c-topic').value;
    if (document.getElementById('c-target-lang')) fields.target_lang = document.getElementById('c-target-lang').value;
    if (document.getElementById('c-time')) fields.time = document.getElementById('c-time').value;
    if (document.getElementById('c-destination')) fields.destination = document.getElementById('c-destination').value;
    if (document.getElementById('c-days')) fields.days = document.getElementById('c-days').value;

    resultDiv.innerHTML = 'AI 正在创作...';

    try {
        const response = await fetch('/api/generate/creative', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task: task,
                fields: fields,
                provider: document.getElementById('provider-select').value,
                model: document.getElementById('model-input').value,
                api_key: apiKey,
                base_url: document.getElementById('baseurl-input').value || null
            })
        });

        // Handle Download (Excel)
        const contentType = response.headers.get("content-type");
        if (contentType && (contentType.includes("application/vnd.openxmlformats") || contentType.includes("application/octet-stream"))) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `creative_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            resultDiv.innerHTML = '✅ Excel 文件已生成并下载。';
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        resultDiv.innerHTML = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            resultDiv.innerText += decoder.decode(value);
        }
    } catch (e) {
        resultDiv.innerHTML = `Error: ${e.message}`;
    }
}

function renderCode(container) {
    container.innerHTML = `
        <div class="card">
            <h3>🖥️ 代码助手</h3>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                <select id="code-lang" style="flex:1; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;">
                    <option value="Python">Python</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="HTML/CSS">HTML/CSS</option>
                    <option value="Java">Java</option>
                    <option value="C++">C++</option>
                    <option value="C#">C#</option>
                    <option value="Go">Go</option>
                    <option value="Rust">Rust</option>
                    <option value="PHP">PHP</option>
                    <option value="Swift">Swift</option>
                    <option value="Kotlin">Kotlin</option>
                    <option value="SQL">SQL</option>
                    <option value="Shell">Shell/Bash</option>
                    <option value="VBA">VBA (Excel)</option>
                </select>
                <select id="code-task" style="flex:1; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white;">
                    <option value="generate">✨ 生成代码</option>
                    <option value="review">🔍 审查代码</option>
                    <option value="debug">🐛 调试 Bug</option>
                    <option value="explain">📖 解释代码</option>
                </select>
            </div>
            <textarea id="code-content" placeholder="描述需求或粘贴代码..." style="width: 100%; height: 200px; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white; margin-bottom: 1rem;"></textarea>
            <button onclick="doCodeGenerate()" class="primary-btn">🚀 执行任务</button>
            <div id="code-result" style="margin-top: 1rem; background: #1e1e1e; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;"></div>
        </div>
    `;
}

async function doCodeGenerate() {
    const lang = document.getElementById('code-lang').value;
    const task = document.getElementById('code-task').value;
    const content = document.getElementById('code-content').value;
    const resultDiv = document.getElementById('code-result');
    const apiKey = document.getElementById('apikey-input').value;

    if (!apiKey && !window._hasDefaultKey) { alert("请先配置 API Key"); return; }

    resultDiv.innerHTML = '<span style="color: #9ca3af;">AI 正在思考...</span>';

    try {
        const response = await fetch('/api/code/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task: task,
                language: lang,
                content: content,
                provider: document.getElementById('provider-select').value,
                model: document.getElementById('model-input').value,
                api_key: apiKey,
                base_url: document.getElementById('baseurl-input').value || null
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullText += decoder.decode(value);
            resultDiv.innerText = fullText; // Simple text render, could be markdown
        }
    } catch (e) {
        resultDiv.innerHTML = `Error: ${e.message}`;
    }
}



function renderMarkdown(container) {
    container.innerHTML = `
        <div class="card" style="height: 100%; display: flex; flex-direction: column;">
            <h3>📝 Markdown 编辑器</h3>
            <div style="flex: 1; display: flex; gap: 1rem; height: 0;">
                <textarea id="md-editor" oninput="updateMdPreview()" style="flex: 1; height: 100%; padding: 1rem; background: var(--bg-darker); border: 1px solid var(--border); color: white; resize: none; font-family: monospace;"># Hello Markdown</textarea>
                <div id="md-preview" style="flex: 1; height: 100%; padding: 1rem; border: 1px solid var(--border); overflow-y: auto; background: var(--bg-card);"></div>
            </div>
        </div>
    `;
    updateMdPreview();
}

function updateMdPreview() {
    const content = document.getElementById('md-editor').value;
    document.getElementById('md-preview').textContent = content; // Simple text for now, ideally use marked.js
    // Note: In a real app we'd load marked.js or similar
}

function renderSystem(container) {
    container.innerHTML = `
        <div class="card">
            <h3>💻 系统控制</h3>
            <div class="alert" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; color: #fca5a5;">
                ⚠️ 警告：此功能允许执行 Python 代码来操作文件系统。请谨慎使用。
            </div>
            <textarea id="sys-query" placeholder="例如：把当前目录所有 .jpg 文件移动到 'Images' 文件夹" style="width: 100%; height: 100px; padding: 0.5rem; background: var(--bg-darker); border: 1px solid var(--border); color: white; margin-bottom: 1rem;"></textarea>
            <button onclick="doSystemGenerate()" class="primary-btn">🛠️ 生成代码</button>
            <div id="sys-code-area" style="margin-top: 1rem; display: none;">
                 <textarea id="sys-code" style="width: 100%; height: 200px; padding: 0.5rem; background: #1e1e1e; border: 1px solid var(--border); color: #a5b4fc; font-family: monospace;"></textarea>
                 <button onclick="doSystemExecute()" class="primary-btn" style="background: #ef4444; margin-top: 0.5rem;">▶️ 确认执行</button>
            </div>
            <pre id="sys-output" style="background: black; padding: 1rem; margin-top: 1rem; display: none;"></pre>
        </div>
    `;
}

async function doSystemGenerate() {
    const query = document.getElementById('sys-query').value;
    const apiKey = document.getElementById('apikey-input').value;
    if (!apiKey && !window._hasDefaultKey) { alert("请先配置 API Key"); return; }

    try {
        const response = await fetch('/api/system/generate_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: query,
                provider: document.getElementById('provider-select').value,
                model: document.getElementById('model-input').value,
                api_key: apiKey,
                base_url: document.getElementById('baseurl-input').value || null
            })
        });
        const res = await safeJson(response);
        document.getElementById('sys-code').value = res.code;
        document.getElementById('sys-code-area').style.display = 'block';
    } catch (e) {
        alert(e.message);
    }
}

async function doSystemExecute() {
    const code = document.getElementById('sys-code').value;
    try {
        const response = await fetch('/api/system/execute_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });
        const res = await safeJson(response);
        const outDiv = document.getElementById('sys-output');
        outDiv.style.display = 'block';
        outDiv.innerText = res.output;
    } catch (e) {
        alert(e.message);
    }
}

function renderTools(container) {
    container.innerHTML = `
        <div class="tool-grid">
            <!-- Pomodoro Timer -->
            <div class="tool-card">
                <h4>🍅 番茄钟</h4>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">专注25分钟，休息5分钟，高效工作法</p>
                <div class="pomodoro-display">
                    <div id="pomo-timer" class="timer">25:00</div>
                    <div id="pomo-label" style="color: var(--text-muted); margin-top: 0.5rem;">🎯 专注模式</div>
                </div>
                <div class="pomodoro-btns">
                    <button onclick="pomoStart()" id="pomo-start-btn">▶ 开始</button>
                    <button onclick="pomoPause()">⏸ 暂停</button>
                    <button onclick="pomoReset()">🔄 重置</button>
                </div>
                <div style="text-align: center; margin-top: 1rem; color: var(--text-muted); font-size: 0.85rem;">
                    已完成 <span id="pomo-count" style="color: var(--primary); font-weight: 700;">0</span> 个番茄
                </div>
            </div>

            <!-- Word Counter -->
            <div class="tool-card">
                <h4>📊 字数统计</h4>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">实时统计字符数、词数、行数</p>
                <textarea id="wc-input" oninput="updateWordCount()" placeholder="在此粘贴或输入文本..." style="width:100%; height:150px; padding:0.5rem; background:var(--bg-darker); border:1px solid var(--border); color:white; resize:vertical;"></textarea>
                <div class="word-stats">
                    <div class="word-stat-item"><div class="stat-num" id="wc-chars">0</div><div class="stat-label">字符</div></div>
                    <div class="word-stat-item"><div class="stat-num" id="wc-chars-ns">0</div><div class="stat-label">不含空格</div></div>
                    <div class="word-stat-item"><div class="stat-num" id="wc-words">0</div><div class="stat-label">词数</div></div>
                    <div class="word-stat-item"><div class="stat-num" id="wc-lines">0</div><div class="stat-label">行数</div></div>
                </div>
            </div>

            <!-- Password Generator -->
            <div class="tool-card">
                <h4>🔐 密码生成器</h4>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">一键生成高强度随机密码</p>
                <div class="password-output" id="pw-output" onclick="copyPassword()" title="点击复制">点击下方按钮生成</div>
                <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
                    <label style="white-space: nowrap; color: var(--text-muted); font-size: 0.9rem;">长度:</label>
                    <input type="range" id="pw-length" min="8" max="64" value="16" oninput="document.getElementById('pw-len-val').textContent=this.value" style="flex:1; margin:0;">
                    <span id="pw-len-val" style="color: var(--primary); font-weight: 700; min-width: 2rem; text-align: center;">16</span>
                </div>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                    <label style="color: var(--text-muted); font-size: 0.85rem;"><input type="checkbox" id="pw-upper" checked> 大写</label>
                    <label style="color: var(--text-muted); font-size: 0.85rem;"><input type="checkbox" id="pw-lower" checked> 小写</label>
                    <label style="color: var(--text-muted); font-size: 0.85rem;"><input type="checkbox" id="pw-num" checked> 数字</label>
                    <label style="color: var(--text-muted); font-size: 0.85rem;"><input type="checkbox" id="pw-sym" checked> 符号</label>
                </div>
                <button onclick="generatePassword()" class="primary-btn" style="width: 100%;">🎲 生成密码</button>
            </div>
        </div>
    `;
}

// --- Pomodoro Timer Logic ---
let pomoInterval = null;
let pomoSeconds = 25 * 60;
let pomoIsWork = true;
let pomoCount = 0;

function pomoStart() {
    if (pomoInterval) return;
    document.getElementById('pomo-start-btn').classList.add('active-btn');
    pomoInterval = setInterval(() => {
        pomoSeconds--;
        if (pomoSeconds < 0) {
            clearInterval(pomoInterval);
            pomoInterval = null;
            if (pomoIsWork) {
                pomoCount++;
                document.getElementById('pomo-count').textContent = pomoCount;
                pomoIsWork = false;
                pomoSeconds = 5 * 60;
                document.getElementById('pomo-label').textContent = '☕ 休息模式';
                document.getElementById('pomo-timer').classList.add('break-mode');
            } else {
                pomoIsWork = true;
                pomoSeconds = 25 * 60;
                document.getElementById('pomo-label').textContent = '🎯 专注模式';
                document.getElementById('pomo-timer').classList.remove('break-mode');
            }
            pomoStart(); // Auto-start next phase
        }
        updatePomoDisplay();
    }, 1000);
}

function pomoPause() {
    clearInterval(pomoInterval);
    pomoInterval = null;
    const btn = document.getElementById('pomo-start-btn');
    if (btn) btn.classList.remove('active-btn');
}

function pomoReset() {
    pomoPause();
    pomoIsWork = true;
    pomoSeconds = 25 * 60;
    updatePomoDisplay();
    const label = document.getElementById('pomo-label');
    const timer = document.getElementById('pomo-timer');
    if (label) label.textContent = '🎯 专注模式';
    if (timer) timer.classList.remove('break-mode');
}

function updatePomoDisplay() {
    const m = Math.floor(pomoSeconds / 60).toString().padStart(2, '0');
    const s = (pomoSeconds % 60).toString().padStart(2, '0');
    const el = document.getElementById('pomo-timer');
    if (el) el.textContent = `${m}:${s}`;
}

// --- Word Counter Logic ---
function updateWordCount() {
    const text = document.getElementById('wc-input').value;
    document.getElementById('wc-chars').textContent = text.length;
    document.getElementById('wc-chars-ns').textContent = text.replace(/\s/g, '').length;
    document.getElementById('wc-words').textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.getElementById('wc-lines').textContent = text ? text.split('\n').length : 0;
}

// --- Password Generator Logic ---
function generatePassword() {
    const len = parseInt(document.getElementById('pw-length').value);
    let chars = '';
    if (document.getElementById('pw-upper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (document.getElementById('pw-lower').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (document.getElementById('pw-num').checked) chars += '0123456789';
    if (document.getElementById('pw-sym').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) { alert('请至少选择一种字符类型'); return; }

    let pw = '';
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) {
        pw += chars[arr[i] % chars.length];
    }
    document.getElementById('pw-output').textContent = pw;
}

function copyPassword() {
    const pw = document.getElementById('pw-output').textContent;
    if (pw === '点击下方按钮生成') return;
    navigator.clipboard.writeText(pw).then(() => {
        const el = document.getElementById('pw-output');
        const orig = el.textContent;
        el.textContent = '✅ 已复制到剪贴板!';
        setTimeout(() => el.textContent = orig, 1500);
    });
}



function renderPPT(container) {
    container.innerHTML = `
        <div class="card">
            <h3>📽️ AI 生成 PPT</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">输入主题，一键生成演示文稿框架。</p>
            
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <input type="text" id="ppt-topic" placeholder="例如：2026年人工智能发展趋势" 
                    style="flex: 1; padding: 0.8rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--bg-darker); color: white;">
                <button onclick="doGeneratePPTOutline()" class="primary-btn" style="width: auto;">🚀 生成大纲</button>
            </div>
            
            <div id="ppt-status" style="margin-bottom: 1rem;"></div>
            
            <div id="ppt-preview" style="display: none; border-top: 1px solid var(--border); padding-top: 1rem;">
                <h4 style="margin-bottom: 0.5rem;">大纲预览 (可编辑)</h4>
                <textarea id="ppt-json" style="width: 100%; height: 300px; background: var(--bg-card); color: #a5b4fc; border: 1px solid var(--border); border-radius: 0.5rem; font-family: monospace; padding: 1rem;"></textarea>
                <div style="margin-top: 1rem; text-align: right;">
                    <button onclick="doCreatePPT()" class="primary-btn" style="width: auto;">📥 生成并下载 PPTX</button>
                </div>
            </div>
        </div>
    `;
}

function renderViz(container) {
    container.innerHTML = `
        <div class="card">
            <h3>📊 数据可视化</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">上传表格数据，在线生成图表。</p>
            
            <input type="file" id="viz-file" accept=".csv, .xlsx, .xls" onchange="doUploadTable()" style="margin-bottom: 1rem;">
            
                <div id="viz-config" style="display: none; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                    <div class="responsive-grid-2col" style="margin-bottom: 1rem;">
                        <div>
                            <label style="display: block; color: var(--text-muted); margin-bottom: 0.5rem;">图表类型</label>
                            <select id="viz-type" class="modal-body" style="width: 100%; margin: 0;">
                                <option value="bar">柱状图</option>
                                <option value="line">折线图</option>
                                <option value="pie">饼图</option>
                                <option value="scatter">散点图</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; color: var(--text-muted); margin-bottom: 0.5rem;">X 轴 (类别)</label>
                            <select id="viz-x" class="modal-body" style="width: 100%; margin: 0;"></select>
                        </div>
                    </div>

                    <div id="viz-y-series-container">
                        <div class="viz-y-series-item" style="display: flex; gap: 0.5rem; align-items: flex-end; margin-bottom: 1rem;">
                            <div style="flex: 1;">
                                <label style="display: block; color: var(--text-muted); margin-bottom: 0.5rem;">Y 轴 (数值序列)</label>
                                <select class="viz-y-select modal-body" style="width: 100%; margin: 0;"></select>
                            </div>
                            <button onclick="addVizYSeries()" class="primary-btn" style="padding: 0.6rem; background: var(--bg-darker); border: 1px solid var(--border); width: 42px; height: 42px; min-height: 42px;" title="添加数据序列">➕</button>
                        </div>
                    </div>
                    
                    <button onclick="doGenerateChart()" class="primary-btn" style="margin-top: 0.5rem;">🎨 生成图表</button>
                </div>
            
            <div id="viz-chart-actions" style="display: none; text-align: right; margin-bottom: 1rem; gap: 0.5rem; justify-content: flex-end;">
                <button onclick="downloadChart('png')" class="primary-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: var(--bg-darker); border: 1px solid var(--border); width: auto;">⬇ 下载 PNG</button>
                <button onclick="downloadChart('jpg')" class="primary-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: var(--bg-darker); border: 1px solid var(--border); width: auto;">⬇ 下载 JPG</button>
                <button onclick="downloadChart('svg')" class="primary-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: var(--bg-darker); border: 1px solid var(--border); width: auto;">⬇ 下载 SVG</button>
            </div>

            <div id="viz-chart-container" style="margin-top: 0.5rem; height: 450px; display: none; background: var(--bg-card); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem;">
                <canvas id="viz-canvas"></canvas>
            </div>
            
            <div id="viz-status"></div>
        </div>
    `;
}

function renderMindMap(container) {
    container.innerHTML = `
        <div class="card">
            <h3>🧠 思维导图 & 图表</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">输入核心主题，AI 自动生成结构化导图或图表。</p>
            
            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                <select id="mm-type" style="padding: 0.8rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--bg-darker); color: white; width: 140px;">
                    <option value="mindmap">🧠 思维导图</option>
                    <option value="flowchart">➡️ 流程图</option>
                    <option value="timeline">⏳ 时间轴</option>
                    <option value="gantt">📅 甘特图</option>
                    <option value="sequence">🔗 时序图</option>
                    <option value="class">📦 类图</option>
                    <option value="state">🔄 状态图</option>
                    <option value="pie">🥧 饼图</option>
                </select>
                <input type="text" id="mm-topic" placeholder="例如：Python 学习路线" 
                    style="flex: 1; padding: 0.8rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--bg-darker); color: white;">
                <button onclick="doGenerateMindMap()" class="primary-btn" style="width: auto;">🚀 生成</button>
            </div>
            
            <div id="mm-status" style="margin-bottom: 1rem;"></div>
            
            <div id="mm-container" style="display: none;">
                <div class="mm-actions" style="text-align: right; margin-bottom: 0.5rem; gap: 0.5rem; display: flex; justify-content: flex-end; align-items: center;">
                     <button onclick="toggleMmCode()" class="primary-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: var(--bg-darker); border: 1px solid var(--border); margin-right: auto;">📝 查看源码</button>
                     <button onclick="downloadMindMap('svg')" class="primary-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: var(--bg-darker); border: 1px solid var(--border);">⬇ 下载 SVG</button>
                     <button onclick="downloadMindMap('png')" class="primary-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: var(--bg-darker); border: 1px solid var(--border);">⬇ 下载 PNG</button>
                </div>
                <div id="mm-code-container" style="display: none; margin-bottom: 1rem;">
                    <textarea id="mm-code-editor" style="width: 100%; height: 200px; background: #1e1e1e; color: #a5b4fc; border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.8rem; font-family: monospace; font-size: 0.9rem;"></textarea>
                    <button onclick="applyMmCode()" class="primary-btn" style="margin-top: 0.5rem; width: auto; padding: 0.4rem 1rem;">▶ 重新渲染</button>
                </div>
                <div style="overflow: auto; border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; background: var(--bg-card); min-height: 400px; position: relative;">
                    <div class="mermaid" id="mermaid-render" style="text-align: center;"></div>
                    <div id="mm-render-error" style="display: none; position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; color: #fca5a5; padding: 2rem; text-align: center; backdrop-filter: blur(4px);"></div>
                </div>
            </div>
        </div>
    `;
}

function toggleMmCode() {
    const container = document.getElementById('mm-code-container');
    if (container) container.style.display = container.style.display === 'none' ? 'block' : 'none';
}

function applyMmCode() {
    const code = document.getElementById('mm-code-editor').value;
    const renderDiv = document.getElementById('mermaid-render');
    const errorDiv = document.getElementById('mm-render-error');

    if (errorDiv) errorDiv.style.display = 'none';
    if (renderDiv) {
        // Clear previous content
        renderDiv.innerHTML = '<div class="loading-spinner"></div> 渲染中...';

        import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs').then(async (mermaid) => {
            mermaid.default.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                fontFamily: 'Inter, system-ui, sans-serif'
            });

            try {
                // Use the more robust render API
                const id = 'mermaid-svg-' + Date.now();
                const { svg } = await mermaid.default.render(id, code);
                renderDiv.innerHTML = svg;
            } catch (err) {
                console.error("Mermaid Render Error:", err);
                if (errorDiv) {
                    errorDiv.innerHTML = `<div>⚠️ 渲染失败：可能是语法有误。<br><small style="opacity: 0.7;">${err.message || '查看控制台了解详情'}</small></div>`;
                    errorDiv.style.display = 'flex';
                }
                renderDiv.innerHTML = ''; // Clear spinner
            }
        });
    }
}

async function downloadMindMap(format) {
    const renderDiv = document.getElementById('mermaid-render');
    const svg = renderDiv.querySelector('svg');

    if (!svg) {
        alert("请先生成思维导图");
        return;
    }

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    // Add namespace if missing
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Ensure styles are inline (Mermaid usually handles this, but basic styles helps)
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `mindmap_${timestamp}.${format}`;

    if (format === 'svg') {
        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else if (format === 'png') {
        const image = new Image();
        image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

        image.onload = function () {
            const canvas = document.createElement('canvas');
            // Use getBBox to ensure we capture the whole SVG usually
            // but relying on width/height attributes is safer for simplicity
            const width = svg.viewBox.baseVal.width || svg.width.baseVal.value || 1200;
            const height = svg.viewBox.baseVal.height || svg.height.baseVal.value || 800;

            // Increase resolution for PNG
            const scale = 2;
            canvas.width = width * scale;
            canvas.height = height * scale;

            const context = canvas.getContext('2d');
            context.fillStyle = '#1e1e1e'; // Dark background
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.scale(scale, scale);

            context.drawImage(image, 0, 0);

            const a = document.createElement('a');
            a.download = filename;
            a.href = canvas.toDataURL('image/png');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        image.onerror = function () {
            alert("导出图片失败");
        };
    }
}

// --- Actions ---

// Search State
let searchPage = 1;
let lastQuery = "";

async function doSearch() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    lastQuery = query;
    searchPage = 1;

    document.getElementById('search-results').innerHTML = '';
    document.getElementById('ai-summary-card').style.display = 'none';
    document.getElementById('load-more-container').style.display = 'none';

    await fetchSearchResults();
}

async function doLoadMore() {
    searchPage++;
    await fetchSearchResults();
}

async function fetchSearchResults() {
    const resultsDiv = document.getElementById('search-results');
    const statusDiv = document.getElementById('search-status');
    const loadMoreBtn = document.getElementById('load-more-container');
    const apiKey = document.getElementById('apikey-input').value;

    if (searchPage === 1) {
        statusDiv.innerHTML = '🔍 正在联网搜索...';
    } else {
        const btn = loadMoreBtn.querySelector('button');
        if (btn) btn.innerText = '⏳ 加载中...';
    }

    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: lastQuery,
                page: searchPage,
                max_results: 10,
                optimize: (searchPage === 1 && !!apiKey),
                provider: document.getElementById('provider-select').value,
                model: document.getElementById('model-input').value,
                api_key: apiKey,
                base_url: document.getElementById('baseurl-input').value || null
            })
        });

        const data = await safeJson(response);

        if (response.ok) {
            // Update Status (Only on page 1)
            if (searchPage === 1) {
                if (data.optimized_query && data.optimized_query !== lastQuery) {
                    statusDiv.innerHTML = `✅ 已优化关键词：<span style="color: #a5b4fc; font-weight: bold;">${data.optimized_query}</span>`;
                } else {
                    statusDiv.innerHTML = `✅ 搜索完成`;
                }

                if (apiKey && data.results.length > 0) {
                    doAiSummary(lastQuery, data.results);
                }
            }

            // Append Results
            if (data.results.length > 0) {
                const startIdx = (searchPage - 1) * 10;
                const html = data.results.map((r, i) => `
                    <div class="search-result" style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                        <h3 style="font-size: 1.1rem; margin-bottom: 0.3rem;"><a href="${r.href}" target="_blank" style="color: #60a5fa; text-decoration: none;">${startIdx + i + 1}. ${r.title}</a></h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">${r.body}</p>
                    </div>
                `).join('');
                resultsDiv.insertAdjacentHTML('beforeend', html);

                // Show Load More
                loadMoreBtn.style.display = 'block';
                const btn = loadMoreBtn.querySelector('button');
                if (btn) btn.innerText = '👇 加载更多';
            } else {
                if (searchPage === 1) {
                    statusDiv.innerHTML = `<span style="color: #ef4444;">❌ 未找到相关结果</span>`;
                } else {
                    loadMoreBtn.style.display = 'none';
                    alert("没有更多结果了");
                }
            }

        } else {
            statusDiv.innerHTML = `<span style="color: #ef4444;">❌ 搜索失败: ${data.detail}</span>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `<span style="color: #ef4444;">❌ 网络错误: ${e.message}</span>`;
    }
}

async function doAiSummary(userQuery, results) {
    const summaryCard = document.getElementById('ai-summary-card');
    const summaryContent = document.getElementById('ai-summary-content');

    summaryCard.style.display = 'block';
    summaryContent.innerHTML = '<span style="color: var(--text-muted);">✨ 正在阅读网页并总结答案...</span>';

    // Prepare Context
    const context = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.body}`).join('\n\n');
    const prompt = `
    用户问题：${userQuery}
    
    以下是搜索到的网页结果：
    ${context}
    
    请根据以上结果，回答用户的问题。
    要求：
    1. 综合多方信息，给出一个全面、准确的回答。
    2. 如果结果中包含无关信息，请忽略。
    3. 在回答中适当地标注引用来源，例如 [1], [2]。
    4. 保持客观、简洁。
    `;

    const messages = [{ "role": "user", "content": prompt }];

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages,
                provider: document.getElementById('provider-select').value,
                model: document.getElementById('model-input').value,
                api_key: document.getElementById('apikey-input').value,
                base_url: document.getElementById('baseurl-input').value || null
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            fullText += text;
            summaryContent.innerText = fullText;
        }
    } catch (e) {
        summaryContent.innerHTML = `<span style="color: #ef4444;">总结失败: ${e.message}</span>`;
    }
}

// Settings Manager
function toggleSettings() {
    document.getElementById('settings-modal').classList.toggle('hidden');
}

function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function loadSettings() {
    const providerSelect = document.getElementById('provider-select');
    const modelInput = document.getElementById('model-input');
    const apiKeyInput = document.getElementById('apikey-input');
    const baseUrlInput = document.getElementById('baseurl-input');

    // 从 localStorage 加载用户保存的配置
    const storedProvider = localStorage.getItem('llm_provider');
    const storedModel = localStorage.getItem('llm_model');
    const storedKey = localStorage.getItem('llm_key');

    // 如果用户之前保存过，直接使用
    if (storedProvider !== null) providerSelect.value = storedProvider;
    if (storedModel !== null) modelInput.value = storedModel;
    if (storedKey !== null) apiKeyInput.value = storedKey;
    baseUrlInput.value = localStorage.getItem('llm_base_url') || "";
    document.getElementById('sys-prompt-input').value = localStorage.getItem('llm_sys_prompt') || "";

    // 从后端获取默认配置（不含 API Key），仅在用户未保存时使用
    fetch('/api/defaults').then(r => safeJson(r)).then(defaults => {
        if (storedProvider === null && defaults.provider) providerSelect.value = defaults.provider;
        if (storedModel === null && defaults.model) modelInput.value = defaults.model;
        // 缓存默认 Key 状态，供所有功能函数判断
        window._hasDefaultKey = !!defaults.has_default_key;
        // API Key placeholder 提示
        if (defaults.has_default_key) {
            apiKeyInput.placeholder = "留空则使用内置密钥";
        } else {
            apiKeyInput.placeholder = "请输入您的 API Key";
        }
    }).catch(() => {
        // 后端不可用时使用硬编码 fallback（不含 Key）
        if (storedProvider === null) providerSelect.value = "OpenRouter";
    });
}

function saveSettings() {
    const provider = document.getElementById('provider-select').value;
    const model = document.getElementById('model-input').value;
    const apiKey = document.getElementById('apikey-input').value;
    const baseUrl = document.getElementById('baseurl-input').value;
    const sysPrompt = document.getElementById('sys-prompt-input').value;

    localStorage.setItem('llm_provider', provider);
    localStorage.setItem('llm_model', model);
    localStorage.setItem('llm_key', apiKey);
    localStorage.setItem('llm_base_url', baseUrl);
    localStorage.setItem('llm_sys_prompt', sysPrompt);

    // Visual feedback
    const btn = document.querySelector('#settings-modal .primary-btn');
    const originalText = btn.innerText;
    btn.innerText = "✅ 已保存";
    setTimeout(() => {
        btn.innerText = originalText;
        closeSettingsModal();
    }, 800);
}

async function doChat() {
    const inputEl = document.getElementById('chat-input');
    const historyEl = document.getElementById('chat-history');
    const message = inputEl.value.trim();

    if (!message) return;

    // Clear input
    inputEl.value = '';

    // Append User Message
    appendMessage('user', message);

    // Config
    const provider = document.getElementById('provider-select').value;
    const model = document.getElementById('model-input').value;
    const apiKey = document.getElementById('apikey-input').value;
    const baseUrl = document.getElementById('baseurl-input').value;




    // Prepare history
    if (!window.chatState) window.chatState = [];
    window.chatState.push({ role: 'user', content: message });

    // Inject Model Identity and Custom System Prompt
    let requestMessages = [...window.chatState];
    const sysPrompt = localStorage.getItem('llm_sys_prompt');
    const modelName = document.getElementById('model-input').value || "Unknown Model";

    // Construct system content
    let systemContent = `[System Info] Current Model: ${modelName}`;
    if (sysPrompt && sysPrompt.trim()) {
        systemContent += "\n" + sysPrompt.trim();
    }

    requestMessages = [
        { role: "system", content: systemContent },
        ...window.chatState
    ];

    // Placeholder for AI Message
    const aiMsgId = 'ai-' + Date.now();
    appendMessage('assistant', '', aiMsgId);
    const aiContentEl = document.getElementById(aiMsgId).querySelector('.msg-content');
    let fullResponse = "";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: requestMessages,
                provider: provider,
                model: model,
                api_key: apiKey,
                base_url: baseUrl || null
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            fullResponse += text;
            aiContentEl.innerText = fullResponse; // Update UI
            historyEl.scrollTop = historyEl.scrollHeight; // Auto scroll
        }

        // Update History State
        window.chatState.push({ role: 'assistant', content: fullResponse });

    } catch (e) {
        aiContentEl.innerHTML += `<br><span style="color: #ef4444;">[Error: ${e.message}]</span>`;
    }
}

function appendMessage(role, text, id = null) {
    const historyEl = document.getElementById('chat-history');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;
    if (id) msgDiv.id = id;

    msgDiv.style.marginBottom = '1rem';
    msgDiv.style.padding = '0.8rem 1rem';
    msgDiv.style.borderRadius = '0.5rem';
    msgDiv.style.maxWidth = '80%';
    msgDiv.style.lineHeight = '1.5';

    if (role === 'user') {
        msgDiv.style.marginLeft = 'auto';
        msgDiv.style.backgroundColor = 'var(--primary)';
        msgDiv.style.color = 'white';
    } else if (role === 'assistant') {
        msgDiv.style.marginRight = 'auto';
        msgDiv.style.backgroundColor = 'var(--bg-card)';
        msgDiv.style.border = '1px solid var(--border)';
    } else {
        msgDiv.style.margin = '0 auto';
        msgDiv.style.fontSize = '0.8rem';
        msgDiv.style.color = 'var(--text-muted)';
        msgDiv.style.background = 'transparent';
    }

    msgDiv.innerHTML = `<div class="msg-content" style="white-space: pre-wrap;">${text}</div>`;
    historyEl.appendChild(msgDiv);
    historyEl.scrollTop = historyEl.scrollHeight;
}

async function doPdfToWord() {
    const fileInput = document.getElementById('p2w-file');
    const statusDiv = document.getElementById('p2w-status');

    if (fileInput.files.length === 0) {
        statusDiv.innerHTML = '<span style="color: #fbbf24;">请选择文件</span>';
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    statusDiv.innerHTML = '<span>⏳ 正在转换中，请稍候...</span>';

    try {
        const response = await fetch('/api/convert/pdf-to-word', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileInput.files[0].name.replace('.pdf', '.docx');
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            statusDiv.innerHTML = '<span style="color: #4ade80;">✅ 转换成功，已自动下载</span>';
        } else {
            const err = await safeJson(response);
            statusDiv.innerHTML = `<span style="color: #ef4444;">转换失败: ${err.detail}</span>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `<span style="color: #ef4444;">网络错误: ${e.message}</span>`;
    }
}

async function doImgToPdf() {
    const fileInput = document.getElementById('i2p-files');
    const statusDiv = document.getElementById('i2p-status');

    if (fileInput.files.length === 0) {
        statusDiv.innerHTML = '<span style="color: #fbbf24;">请选择图片</span>';
        return;
    }

    const formData = new FormData();
    for (const file of fileInput.files) {
        formData.append('files', file);
    }

    statusDiv.innerHTML = '<span>⏳ 正在处理中...</span>';

    try {
        const response = await fetch('/api/convert/img-to-pdf', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "merged_images.pdf";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            statusDiv.innerHTML = '<span style="color: #4ade80;">✅ 合并成功，已自动下载</span>';
        } else {
            const err = await safeJson(response);
            statusDiv.innerHTML = `<span style="color: #ef4444;">操作失败: ${err.detail}</span>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `<span style="color: #ef4444;">网络错误: ${e.message}</span>`;
    }
}

async function doGeneratePPTOutline() {
    const topic = document.getElementById('ppt-topic').value;
    const statusDiv = document.getElementById('ppt-status');
    const previewDiv = document.getElementById('ppt-preview');

    // Config
    const provider = document.getElementById('provider-select').value;
    const model = document.getElementById('model-input').value;
    const apiKey = document.getElementById('apikey-input').value;
    const baseUrl = document.getElementById('baseurl-input').value;

    if (!topic) {
        statusDiv.innerHTML = '<span style="color: #fbbf24;">请输入主题</span>';
        return;
    }
    if (!apiKey && !window._hasDefaultKey) {
        statusDiv.innerHTML = '<span style="color: #fbbf24;">请先配置 API Key</span>';
        return;
    }

    statusDiv.innerHTML = '<span>⏳ 正在构思大纲... (这可能需要几十秒)</span>';
    previewDiv.style.display = 'none';

    try {
        const response = await fetch('/api/generate/ppt/outline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: topic,
                provider: provider,
                model: model,
                api_key: apiKey,
                base_url: baseUrl || null
            })
        });

        const res = await safeJson(response);

        if (response.ok) {
            statusDiv.innerHTML = '<span style="color: #4ade80;">✅ 大纲生成成功，请确认内容</span>';
            const jsonText = document.getElementById('ppt-json');
            jsonText.value = JSON.stringify(res.data, null, 2);
            previewDiv.style.display = 'block';
        } else {
            statusDiv.innerHTML = `<span style="color: #ef4444;">生成失败: ${res.detail}</span>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `<span style="color: #ef4444;">网络错误: ${e.message}</span>`;
    }
}

async function doCreatePPT() {
    const jsonStr = document.getElementById('ppt-json').value;
    const statusDiv = document.getElementById('ppt-status');

    try {
        const data = JSON.parse(jsonStr);

        statusDiv.innerHTML = '<span>⏳ 正在生成 PPT 文件...</span>';

        const response = await fetch('/api/generate/ppt/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "presentation.pptx";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            statusDiv.innerHTML = '<span style="color: #4ade80;">✅ PPT 下载成功！</span>';
        } else {
            const err = await safeJson(response);
            statusDiv.innerHTML = `<span style="color: #ef4444;">生成文件失败: ${err.detail}</span>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `<span style="color: #ef4444;">JSON 格式错误或网络错误: ${e.message}</span>`;
    }
}

// Global Viz Data
let vizData = null;
let vizChart = null;

async function doUploadTable() {
    const fileInput = document.getElementById('viz-file');
    const statusDiv = document.getElementById('viz-status');
    const configDiv = document.getElementById('viz-config');

    if (fileInput.files.length === 0) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    statusDiv.innerHTML = '<span>⏳ 正在解析数据...</span>';

    try {
        const response = await fetch('/api/analyze/table', {
            method: 'POST',
            body: formData
        });
        const res = await safeJson(response);

        if (response.ok) {
            vizData = res;
            statusDiv.innerHTML = `<span>✅ 已加载 ${res.total_rows} 行数据</span>`;
            configDiv.style.display = 'block';

            // Reset Y series
            const yContainer = document.getElementById('viz-y-series-container');
            yContainer.innerHTML = `
                <div class="viz-y-series-item" style="display: flex; gap: 0.5rem; align-items: flex-end; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <label style="display: block; color: var(--text-muted); margin-bottom: 0.5rem;">Y 轴 (数值序列)</label>
                        <select class="viz-y-select modal-body" style="width: 100%; margin: 0;"></select>
                    </div>
                    <button onclick="addVizYSeries()" class="primary-btn" style="padding: 0.6rem; background: var(--bg-darker); border: 1px solid var(--border); width: 42px; height: 42px; min-height: 42px;" title="添加数据序列">➕</button>
                </div>
            `;

            // Populate Selects
            const xSelect = document.getElementById('viz-x');
            const ySelect = yContainer.querySelector('.viz-y-select');

            xSelect.innerHTML = '';
            ySelect.innerHTML = '';

            res.columns.forEach(col => {
                const opt = document.createElement('option');
                opt.value = col;
                opt.innerText = col;
                xSelect.appendChild(opt);
            });

            res.numeric_columns.forEach(col => {
                const opt = document.createElement('option');
                opt.value = col;
                opt.innerText = col;
                ySelect.appendChild(opt);
            });
        } else {
            statusDiv.innerHTML = `<span style="color: #ef4444;">解析失败: ${res.detail}</span>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `<span style="color: #ef4444;">网络错误: ${e.message}</span>`;
    }
}

function addVizYSeries() {
    if (!vizData) return;
    const container = document.getElementById('viz-y-series-container');
    const newItem = document.createElement('div');
    newItem.className = 'viz-y-series-item';
    newItem.style.cssText = 'display: flex; gap: 0.5rem; align-items: flex-end; margin-bottom: 1rem;';

    let optionsHtml = vizData.numeric_columns.map(col => `<option value="${col}">${col}</option>`).join('');

    newItem.innerHTML = `
        <div style="flex: 1;">
            <select class="viz-y-select modal-body" style="width: 100%; margin: 0;">
                ${optionsHtml}
            </select>
        </div>
        <button onclick="this.parentElement.remove()" class="primary-btn" style="padding: 0.6rem; background: var(--bg-darker); border: 1px solid var(--border); width: 42px; height: 42px; min-height: 42px;" title="移除序列">❌</button>
    `;
    container.appendChild(newItem);
}

function doGenerateChart() {
    if (!vizData) return;

    const type = document.getElementById('viz-type').value;
    const xCol = document.getElementById('viz-x').value;
    const selectedYCols = Array.from(document.querySelectorAll('.viz-y-select')).map(sel => sel.value);

    if (selectedYCols.length === 0) {
        alert("请选择至少一个 Y 轴字段");
        return;
    }

    const ctx = document.getElementById('viz-canvas').getContext('2d');
    const container = document.getElementById('viz-chart-container');
    container.style.display = 'block';

    if (vizChart) vizChart.destroy();

    const labels = vizData.data.map(row => row[xCol]);

    // Color Palette
    const colors = [
        { bg: 'rgba(99, 102, 241, 0.5)', border: 'rgba(99, 102, 241, 1)' },
        { bg: 'rgba(236, 72, 153, 0.5)', border: 'rgba(236, 72, 153, 1)' },
        { bg: 'rgba(16, 185, 129, 0.5)', border: 'rgba(16, 185, 129, 1)' },
        { bg: 'rgba(245, 158, 11, 0.5)', border: 'rgba(245, 158, 11, 1)' },
        { bg: 'rgba(59, 130, 246, 0.5)', border: 'rgba(59, 130, 246, 1)' },
        { bg: 'rgba(139, 92, 246, 0.5)', border: 'rgba(139, 92, 246, 1)' }
    ];

    const datasets = selectedYCols.map((yCol, index) => {
        const color = colors[index % colors.length];
        return {
            label: yCol,
            data: vizData.data.map(row => row[yCol]),
            backgroundColor: color.bg,
            borderColor: color.border,
            borderWidth: 1,
            fill: type === 'line' ? false : true
        };
    });

    vizChart = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#94a3b8', font: { size: 12 } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                }
            }
        }
    });

    document.getElementById('viz-chart-actions').style.display = 'flex';
}

function downloadChart(format) {
    const canvas = document.getElementById('viz-canvas');
    if (!canvas) return;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `chart_${timestamp}.${format}`;

    if (format === 'jpg') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(canvas, 0, 0);

        const link = document.createElement('a');
        link.download = filename;
        link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
        link.click();
    } else if (format === 'svg') {
        // Create an SVG wrapper with the canvas content as a base64 image
        const imgData = canvas.toDataURL('image/png');
        const width = canvas.width;
        const height = canvas.height;

        const svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <rect width="100%" height="100%" fill="#1e1e2e" />
                <image href="${imgData}" width="${width}" height="${height}" />
            </svg>
        `.trim();

        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    } else {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}


async function doGenerateMindMap() {
    const topic = document.getElementById('mm-topic').value;
    const type = document.getElementById('mm-type').value;
    const statusDiv = document.getElementById('mm-status');
    const container = document.getElementById('mm-container');
    const renderDiv = document.getElementById('mermaid-render');
    const errorDiv = document.getElementById('mm-render-error');

    // Config
    const provider = document.getElementById('provider-select').value;
    const model = document.getElementById('model-input').value;
    const apiKey = document.getElementById('apikey-input').value;
    const baseUrl = document.getElementById('baseurl-input').value;

    if (!topic) {
        statusDiv.innerHTML = '<span style="color: #fbbf24;">请输入主题</span>';
        return;
    }
    if (!apiKey && !window._hasDefaultKey) {
        statusDiv.innerHTML = '<span style="color: #fbbf24;">请先配置 API Key</span>';
        return;
    }

    statusDiv.innerHTML = '<span>⏳ 正在构思中... (这可能需要几十秒)</span>';
    container.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';

    try {
        const response = await fetch('/api/generate/mindmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: topic,
                chart_type: type,
                provider: provider,
                model: model,
                api_key: apiKey,
                base_url: baseUrl || null
            })
        });

        const res = await safeJson(response);

        if (response.ok) {
            statusDiv.innerHTML = '<span style="color: #4ade80;">✅ 生成成功</span>';
            container.style.display = 'block';

            // Update source code editor
            const codeEditor = document.getElementById('mm-code-editor');
            if (codeEditor) codeEditor.value = res.code;

            // Render Mermaid using the improved logic
            renderDiv.innerHTML = '<div class="loading-spinner"></div> 正在渲染图表...';

            import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs').then(async (mermaid) => {
                mermaid.default.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    securityLevel: 'loose'
                });

                try {
                    const id = 'mermaid-svg-gen-' + Date.now();
                    const { svg } = await mermaid.default.render(id, res.code);
                    renderDiv.innerHTML = svg;
                } catch (err) {
                    console.error("Auto Render Error:", err);
                    if (errorDiv) {
                        errorDiv.innerHTML = `<div>⚠️ 自动渲染失败：语法不标准。<br><small style="opacity: 0.7;">AI 可能生成了错误的语法。您可以尝试在“查看源码”中手动修正。</small></div>`;
                        errorDiv.style.display = 'flex';
                    }
                    renderDiv.innerHTML = '';
                }
            });

        } else {
            statusDiv.innerHTML = `<span style="color: #ef4444;">生成失败: ${res.detail}</span>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `<span style="color: #ef4444;">网络错误: ${e.message}</span>`;
    }
}

// --- AI Persona Clone Logic ---

let cloneState = {
    systemPrompt: null,
    history: []
};

function renderClone(container) {
    if (!cloneState.systemPrompt) {
        renderCloneUpload(container);
    } else {
        renderCloneChat(container);
    }
}

function renderCloneUpload(container) {
    container.innerHTML = `
        <div class="card">
            <h3>👥 AI 角色克隆</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">上传和那个 Ta 的聊天记录（支持 .txt, .pdf, .docx, .csv），AI 将深度模仿 Ta 的说话方式与你交流。</p>
            
            <div class="upload-zone" style="border: 2px dashed var(--border); padding: 2.5rem; border-radius: 1rem; text-align: center; background: var(--bg-darker); cursor: pointer;" onclick="document.getElementById('clone-file').click()">
                <i data-lucide="upload-cloud" style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--primary);"></i>
                <p>点击或拖拽聊天记录文件到此处</p>
                <span style="font-size: 0.8rem; color: var(--text-muted);">支持：WeChat/WhatsApp 导出的文本、PDF、Word 等</span>
                <input type="file" id="clone-file" hidden onchange="doCloneAnalyze(this)">
            </div>
            
            <div class="responsive-grid-2col" style="margin-top: 1rem;">
                <button onclick="doLocalScan()" class="primary-btn" style="background: var(--bg-darker); border: 1px solid var(--border); color: #a5b4fc;">🔍 自动扫描本地记录</button>
                <button onclick="showClipboardImport()" class="primary-btn" style="background: var(--bg-darker); border: 1px solid var(--border); color: #10b981;">📋 剪贴板一键导入</button>
            </div>

            <div id="local-files-list" style="margin-top: 1rem; display: none;">
                <h4 style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">📁 发现的本地导出记录：</h4>
                <div id="found-files-container" style="max-height: 200px; overflow-y: auto; background: var(--bg-darker); border-radius: 0.5rem; border: 1px solid var(--border);"></div>
            </div>

            <div id="clipboard-import-zone" style="margin-top: 1rem; display: none;">
                <textarea id="raw-chat-text" placeholder="在这里粘贴 QQ/微信 的聊天内容（Ctrl+A 全选聊天窗口内容并复制）..." 
                    style="width: 100%; height: 150px; background: var(--bg-darker); border: 1px solid var(--border); border-radius: 0.5rem; color: white; padding: 0.8rem; font-size: 0.9rem;"></textarea>
                <button onclick="doClipboardImport()" class="primary-btn" style="width: 100%; margin-top: 0.5rem;">🚀 立即导入并克隆</button>
            </div>

            <div style="text-align: right; margin-top: 0.5rem;">
                <button onclick="renderQQExportGuide()" class="primary-btn" style="width: auto; padding: 0.3rem 0.6rem; font-size: 0.8rem; background: transparent; border: 1px solid var(--border); color: var(--text-muted);">❓ 如何导出 QQ/微信聊天记录？</button>
            </div>
            
            <div id="clone-status" style="margin-top: 1.5rem; text-align: center;"></div>
            
            <div style="margin-top: 2rem; padding: 1rem; background: rgba(99, 102, 241, 0.1); border-radius: 0.5rem; border: 1px solid rgba(99, 102, 241, 0.2);">
                <h4 style="margin-top: 0; color: #a5b4fc;">💡 小贴士</h4>
                <ul style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0;">
                    <li>提供至少 50 条以上的对话记录效果更佳。</li>
                    <li>记录中应包含明显的语气特征和常用词汇。</li>
                    <li>隐私声明：聊天记录仅用于一次性特征提取，不会被用于模型训练。</li>
                </ul>
            </div>
        </div>
    `;
    lucide.createIcons();
}

async function doCloneAnalyze(input) {
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const statusDiv = document.getElementById('clone-status');
    const apiKey = document.getElementById('apikey-input').value;

    if (!apiKey && !window._hasDefaultKey) {
        alert("请先配置 API Key");
        return;
    }

    statusDiv.innerHTML = '<span class="loading-spinner"></span> 正在深度分析 Ta 的说话风格，请稍候...';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', document.getElementById('provider-select').value);
    formData.append('model', document.getElementById('model-input').value);
    formData.append('api_key', apiKey);
    const baseUrl = document.getElementById('baseurl-input').value;
    if (baseUrl) formData.append('base_url', baseUrl);

    try {
        const response = await fetch('/api/persona/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await safeJson(response);

        if (response.ok) {
            cloneState.systemPrompt = data.system_prompt;
            cloneState.history = [];
            statusDiv.innerHTML = '✅ 分析完成！正在进入对话...';
            setTimeout(() => loadPage('clone'), 1000); // Reload to show chat UI
        } else {
            statusDiv.innerHTML = `<span style="color: #ef4444;">分析失败: ${data.detail}</span>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `<span style="color: #ef4444;">网络错误: ${e.message}</span>`;
    }
}

function renderCloneChat(container) {
    container.innerHTML = `
        <div class="card" style="display: flex; flex-direction: column; height: 100%; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 10px; height: 10px; background: #60a5fa; border-radius: 50%;"></div>
                    <span style="font-weight: 600;">已成功克隆 Ta 的语癖</span>
                </div>
                <button onclick="resetClone()" class="primary-btn" style="width: auto; padding: 0.3rem 0.6rem; font-size: 0.8rem; background: var(--bg-darker); border: 1px solid var(--border);">🔄 重置角色</button>
            </div>

            <div id="clone-chat-history" style="flex: 1; overflow-y: auto; margin-bottom: 1rem; padding-right: 0.5rem;">
                <div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
                    <p style="font-size: 0.9rem;">Ta 已经准备好和你聊天了。</p>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="clone-chat-input" placeholder="和 Ta 打个招呼吧..." 
                    style="flex: 1; padding: 0.8rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--bg-darker); color: white;"
                    onkeydown="if(event.key === 'Enter') doCloneChat()">
                <button onclick="doCloneChat()" class="primary-btn" style="width: auto;"><i data-lucide="send"></i></button>
            </div>
        </div>
    `;
    lucide.createIcons();

    // Restore history if any
    if (cloneState.history.length > 0) {
        cloneState.history.forEach(msg => appendCloneMessage(msg.role, msg.content));
    }
}

function resetClone() {
    cloneState.systemPrompt = null;
    cloneState.history = [];
    loadPage('clone');
}

async function doCloneChat() {
    const inputEl = document.getElementById('clone-chat-input');
    const historyEl = document.getElementById('clone-chat-history');
    const message = inputEl.value.trim();

    if (!message) return;

    inputEl.value = '';
    appendCloneMessage('user', message);

    const provider = document.getElementById('provider-select').value;
    const model = document.getElementById('model-input').value;
    const apiKey = document.getElementById('apikey-input').value;
    const baseUrl = document.getElementById('baseurl-input').value;

    cloneState.history.push({ role: 'user', content: message });

    const requestMessages = [
        { role: "system", content: cloneState.systemPrompt },
        ...cloneState.history
    ];

    const aiMsgId = 'clone-ai-' + Date.now();
    appendCloneMessage('assistant', '', aiMsgId);
    const aiContentEl = document.getElementById(aiMsgId).querySelector('.msg-content');
    let fullResponse = "";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: requestMessages,
                provider: provider,
                model: model,
                api_key: apiKey,
                base_url: baseUrl || null,
                temperature: 0.95
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            fullResponse += text;
            aiContentEl.innerText = fullResponse;
            historyEl.scrollTop = historyEl.scrollHeight;
        }

        cloneState.history.push({ role: 'assistant', content: fullResponse });

    } catch (e) {
        aiContentEl.innerHTML += `<br><span style="color: #ef4444;">[Error: ${e.message}]</span>`;
    }
}

function appendCloneMessage(role, text, id = null) {
    const historyEl = document.getElementById('clone-chat-history');
    if (!historyEl) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;
    if (id) msgDiv.id = id;

    msgDiv.style.marginBottom = '1rem';
    msgDiv.style.padding = '0.8rem 1rem';
    msgDiv.style.borderRadius = '0.5rem';
    msgDiv.style.maxWidth = '80%';
    msgDiv.style.lineHeight = '1.5';

    if (role === 'user') {
        msgDiv.style.marginLeft = 'auto';
        msgDiv.style.backgroundColor = 'var(--primary)';
        msgDiv.style.color = 'white';
    } else {
        msgDiv.style.marginRight = 'auto';
        msgDiv.style.backgroundColor = 'var(--bg-card)';
        msgDiv.style.border = '1px solid var(--border)';
    }

    msgDiv.innerHTML = `<div class="msg-content" style="white-space: pre-wrap;">${text}</div>`;
    historyEl.appendChild(msgDiv);
    historyEl.scrollTop = historyEl.scrollHeight;
}

async function doLocalScan() {
    const statusDiv = document.getElementById('clone-status');
    const listDiv = document.getElementById('local-files-list');
    const container = document.getElementById('found-files-container');

    statusDiv.innerHTML = '<span class="loading-spinner"></span> 正在扫描磁盘中的聊天导出记录...';

    try {
        const response = await fetch('/api/persona/local_scan');
        const data = await safeJson(response);

        if (data.files && data.files.length > 0) {
            statusDiv.innerHTML = `✅ 扫描完成，发现 ${data.files.length} 个可能的记录文件`;
            listDiv.style.display = 'block';
            container.innerHTML = data.files.map(f => `
                <div onclick="importLocalFile('${f.path.replace(/\\/g, '\\\\')}')" style="padding: 0.8rem; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;" onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='transparent'">
                    <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <span style="color: #a5b4fc; font-weight: 500;">${f.name}</span>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${f.path}</div>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${f.mtime}</span>
                </div>
            `).join('');
        } else {
            statusDiv.innerHTML = '❌ 未发现自动导出的 .txt 文档，请尝试手动导出。';
            listDiv.style.display = 'none';
        }
    } catch (e) {
        statusDiv.innerHTML = `❌ 扫描过程中出错: ${e.message}`;
    }
}

async function importLocalFile(path) {
    const statusDiv = document.getElementById('clone-status');
    const apiKey = document.getElementById('apikey-input').value;

    if (!apiKey && !window._hasDefaultKey) {
        alert("请先配置 API Key");
        return;
    }

    statusDiv.innerHTML = '<span class="loading-spinner"></span> 正在从本地文件提取特征，请稍候...';

    const formData = new FormData();
    formData.append('path', path);
    formData.append('provider', document.getElementById('provider-select').value);
    formData.append('model', document.getElementById('model-input').value);
    formData.append('api_key', apiKey);
    const baseUrl = document.getElementById('baseurl-input').value;
    if (baseUrl) formData.append('base_url', baseUrl);

    try {
        const response = await fetch('/api/persona/import_local', {
            method: 'POST',
            body: formData
        });

        const data = await safeJson(response);

        if (response.ok) {
            cloneState.systemPrompt = data.system_prompt;
            cloneState.history = [];
            statusDiv.innerHTML = '✅ 角色解析成功！';
            setTimeout(() => loadPage('clone'), 1000);
        } else {
            statusDiv.innerHTML = `<span style="color: #ef4444;">解析失败: ${data.detail}</span>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `<span style="color: #ef4444;">网络错误: ${e.message}</span>`;
    }
}

function showClipboardImport() {
    document.getElementById('clipboard-import-zone').style.display = 'block';
    document.getElementById('local-files-list').style.display = 'none';
}

async function doClipboardImport() {
    const text = document.getElementById('raw-chat-text').value.trim();
    if (!text) {
        alert("请先粘贴聊天内容");
        return;
    }

    const statusDiv = document.getElementById('clone-status');
    const apiKey = document.getElementById('apikey-input').value;

    if (!apiKey && !window._hasDefaultKey) {
        alert("请先配置 API Key");
        return;
    }

    statusDiv.innerHTML = '<span class="loading-spinner"></span> 正在分析粘贴的内容，请稍候...';

    const formData = new FormData();
    formData.append('text', text);
    formData.append('provider', document.getElementById('provider-select').value);
    formData.append('model', document.getElementById('model-input').value);
    formData.append('api_key', apiKey);
    const baseUrl = document.getElementById('baseurl-input').value;
    if (baseUrl) formData.append('base_url', baseUrl);

    try {
        const response = await fetch('/api/persona/analyze_text', {
            method: 'POST',
            body: formData
        });

        const data = await safeJson(response);

        if (response.ok) {
            cloneState.systemPrompt = data.system_prompt;
            cloneState.history = [];
            statusDiv.innerHTML = '✅ 剪贴板内容解析成功！';
            setTimeout(() => loadPage('clone'), 1000);
        } else {
            statusDiv.innerHTML = `<span style="color: #ef4444;">分析失败: ${data.detail}</span>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `<span style="color: #ef4444;">网络错误: ${e.message}</span>`;
    }
}

function renderQQExportGuide() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">📘 聊天记录导出指南</h3>
                <button onclick="loadPage('clone')" class="primary-btn" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem;">⬅ 返回上传</button>
            </div>

            <div class="guide-section" style="margin-bottom: 2rem;">
                <h4 style="color: #60a5fa; border-left: 4px solid #60a5fa; padding-left: 0.5rem; margin-bottom: 1rem;">📱 手机端 (推荐)</h4>
                <div style="background: var(--bg-darker); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border);">
                    <ol style="margin: 0; padding-left: 1.2rem; color: var(--text-main); line-height: 1.8;">
                        <li>打开 **QQ 手机版**，进入 **[设置]**</li>
                        <li>点击 **[通用]** -> **[聊天记录备份与迁移]**</li>
                        <li>选择 **[导出聊天记录到电脑]**</li>
                        <li>按照提示选择需要克隆的联系人，通过数据线或局域网导出文件夹</li>
                        <li>在导出的文件夹中找到以 **.txt** 结尾的消息记录文件，上传到本项目即可</li>
                    </ol>
                </div>
            </div>

            <div class="guide-section" style="margin-bottom: 2rem;">
                <h4 style="color: #a5b4fc; border-left: 4px solid #a5b4fc; padding-left: 0.5rem; margin-bottom: 1rem;">💻 电脑端 (手动导出)</h4>
                <div style="background: var(--bg-darker); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border);">
                    <p style="margin-bottom: 1rem; color: var(--text-muted);">如果你习惯使用电脑版 QQ：</p>
                    <ol style="margin: 0; padding-left: 1.2rem; color: var(--text-main); line-height: 1.8;">
                        <li>打开与目标的对话窗口</li>
                        <li>点击右上角 **[更多/消息记录]** (三道杠图标)</li>
                        <li>点击右下角 **[消息管理器]** 按钮</li>
                        <li>在管理器中右键点击目标联系人，选择 **[导出消息记录]**</li>
                        <li>保存类型选择 **文本文件 (.txt)**，然后上传该文件。</li>
                    </ol>
                </div>
            </div>

            <div class="guide-section">
                <h4 style="color: #10b981; border-left: 4px solid #10b981; padding-left: 0.5rem; margin-bottom: 1rem;">💬 微信导出说明</h4>
                <div style="background: var(--bg-darker); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border);">
                    <p style="color: var(--text-main); line-height: 1.6;">微信电脑版暂不支持直接导出 .txt。建议：</p>
                </ul>
            </div>
        </div>
    `;
}


// --- Excel Assistant ---
function renderExcel(container) {
    container.innerHTML = `
        <div class="card">
            <h3>📊 Excel 智能助手</h3>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
                上传 Excel 文件，用自然语言并在 AI 的帮助下进行数据处理、清洗、统计或拆分。
            </p>

            <div class="responsive-grid-2col" style="gap: 2rem;">
                <!-- Left: Inputs -->
                <div>
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">1. 上传 Excel 文件 (.xlsx)</label>
                        <input type="file" id="excel-file" accept=".xlsx" style="background: var(--bg-darker); padding: 0.5rem; border-radius: 0.5rem; border: 1px solid var(--border); width: 100%;">
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">2. 处理需求</label>
                        <textarea id="excel-instruction" placeholder="例如：\n- 计算每个销售员的总销售额\n- 将'日期'列格式化为 YYYY-MM-DD\n- 筛选出销量大于 100 的记录\n- 按照'部门'拆分到不同的 Sheet" 
                            style="width: 100%; height: 150px; padding: 0.8rem; background: var(--bg-darker); border: 1px solid var(--border); color: white; border-radius: 0.5rem; line-height: 1.6;"></textarea>
                    </div>

                    <button onclick="doExcelProcess()" class="primary-btn">🚀 开始处理</button>
                    <div id="excel-status" style="margin-top: 1rem;"></div>
                </div>

                <!-- Right: Tips -->
                <div style="background: rgba(30, 41, 59, 0.5); padding: 1.5rem; border-radius: 0.5rem; border: 1px solid var(--border);">
                    <h4 style="margin-top: 0; color: var(--primary);">💡 使用技巧</h4>
                    <ul style="color: var(--text-muted); line-height: 1.8; padding-left: 1.2rem;">
                        <li>描述越清晰，结果越准确。</li>
                        <li>支持多步操作，例如："先按 A 列排序，然后计算 B 列总和"。</li>
                        <li>可以通过描述新建 Sheet 来保存统计结果。</li>
                        <li>⚠️ AI 将生成并执行 Python 代码，请检查结果是否符合预期。</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

async function doExcelProcess() {
    const fileInput = document.getElementById('excel-file');
    const instruction = document.getElementById('excel-instruction').value;
    const statusDiv = document.getElementById('excel-status');
    const apiKey = document.getElementById('apikey-input').value;

    if (fileInput.files.length === 0) { alert("请选择文件"); return; }
    if (!instruction.trim()) { alert("请输入处理需求"); return; }
    if (!apiKey && !window._hasDefaultKey) { alert("请先配置 API Key"); return; }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("instruction", instruction);
    formData.append("provider", document.getElementById('provider-select').value);
    formData.append("model", document.getElementById('model-input').value);
    formData.append("api_key", apiKey);

    const baseUrl = document.getElementById('baseurl-input').value;
    if (baseUrl) formData.append("base_url", baseUrl);

    statusDiv.innerHTML = '<span class="loading-spinner"></span> 正在分析并处理，可能需要几十秒...';

    try {
        const response = await fetch('/api/excel/process', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `excel_processed_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            statusDiv.innerHTML = '✅ 处理成功！文件已下载。';
        } else {
            const err = await safeJson(response);
            statusDiv.innerHTML = `<div style="color: #fca5a5; background: rgba(127, 29, 29, 0.2); padding: 1rem; border-radius: 0.5rem; white-space: pre-wrap;">❌ 失败: ${err.detail}</div>`;
        }
    } catch (e) {
        statusDiv.innerHTML = `❌ 网络错误: ${e.message}`;
    }
}

