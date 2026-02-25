let isLoginMode = true;

// 如果 localStorage 已经有了 token 并且是在登录页，则考虑回到首页
window.addEventListener('load', () => {
    if (localStorage.getItem('office_auth_token')) {
        window.location.href = '/';
    }
});

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? '登录到系统' : '注册新账号';
    document.getElementById('auth-submit-btn').innerText = isLoginMode ? '确认登录' : '确认注册';
    document.getElementById('auth-switch-text').innerText = isLoginMode ? '还没有账号？' : '已有账号？';
    document.querySelector('.switch-mode').innerText = isLoginMode ? '点击注册' : '点击登录';
    document.getElementById('auth-error').style.display = 'none';
}

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    el.innerText = msg;
    el.style.display = 'block';
}

async function doAuthSubmit() {
    const btn = document.getElementById('auth-submit-btn');
    const u = document.getElementById('auth-username').value.trim();
    const p = document.getElementById('auth-password').value.trim();
    if (!u || !p) return showAuthError("用户名和密码不能为空");

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner" style="display:inline-block; width:16px; height:16px; border:3px solid rgba(255,255,255,0.3); border-radius:50%; border-top-color:var(--primary); animation:spin 1s ease-in-out infinite; margin-right:8px;"></span> 请稍候...';

    // 如果没有全局 stylesheet 的 spin，补个小动画样式
    if (!document.getElementById('spin-style')) {
        const style = document.createElement('style');
        style.id = 'spin-style';
        style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });

        const text = await res.text();
        if (!text || !text.trim()) {
            throw new Error(`服务器返回空响应 (HTTP ${res.status})`);
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`服务器返回非JSON内容`);
        }

        if (!res.ok) throw new Error(data.detail || "操作失败");

        localStorage.setItem('office_auth_token', data.access_token);
        localStorage.setItem('office_auth_username', u);

        window.location.href = '/'; // 登录成功，跳转首页

    } catch (e) {
        showAuthError(e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = isLoginMode ? '确认登录' : '确认注册';
    }
}
