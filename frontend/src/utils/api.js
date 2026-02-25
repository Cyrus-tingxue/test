export const fetchApi = async (endpoint, options = {}) => {
    const token = localStorage.getItem('office_auth_token');
    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        options.body = JSON.stringify(options.body);
    }

    const response = await fetch(endpoint, {
        ...options,
        headers,
    });

    const text = await response.text();
    if (!text || !text.trim()) {
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        return null;
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`服务器返回非JSON内容`);
    }

    if (!response.ok) {
        throw new Error(data.detail || `操作失败 (${response.status})`);
    }

    return data;
};
