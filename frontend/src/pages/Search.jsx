import React, { useState, useContext, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Search as SearchIcon, Sparkles, Menu } from 'lucide-react';

export const Search = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};

    const [query, setQuery] = useState('');
    const [lastQuery, setLastQuery] = useState('');
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const getSettings = () => {
        return {
            provider: localStorage.getItem('llm_provider') || 'OpenRouter',
            model: localStorage.getItem('llm_model') || '',
            apiKey: localStorage.getItem('llm_key') || '',
            baseUrl: localStorage.getItem('llm_base_url') || ''
        };
    };

    const doAiSummary = async (userQuery, searchResults, settings) => {
        setAiSummary('');
        setStatus((prev) => prev + ' (正在生成 AI 总结...)');

        const context = searchResults.map((r, i) => `[${i + 1}] ${r.title}\n${r.body}`).join('\n\n');
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

        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }],
                    provider: settings.provider,
                    model: settings.model,
                    api_key: settings.apiKey,
                    base_url: settings.baseUrl || null
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value);
                setAiSummary(fullText);
            }
            setStatus((prev) => prev.replace(' (正在生成 AI 总结...)', ' (AI 总结已完成)'));
        } catch (e) {
            setAiSummary(`总结失败: ${e.message}`);
        }
    };

    const executeSearch = async (isLoadMore = false) => {
        const currentQuery = isLoadMore ? lastQuery : query.trim();
        if (!currentQuery) return;

        if (isLoadMore) {
            setIsLoadingMore(true);
        } else {
            setIsSearching(true);
            setLastQuery(currentQuery);
            setResults([]);
            setAiSummary('');
            setPage(1);
            setHasMore(false);
            setStatus('正在联网搜索...');
        }

        const currentPage = isLoadMore ? page + 1 : 1;
        const settings = getSettings();
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    query: currentQuery,
                    page: currentPage,
                    max_results: 10,
                    optimize: (currentPage === 1 && !!settings.apiKey),
                    provider: settings.provider,
                    model: settings.model,
                    api_key: settings.apiKey,
                    base_url: settings.baseUrl || null
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('服务器返回无效数据');
            }

            if (!response.ok) {
                throw new Error(data?.detail || `搜索失败 (${response.status})`);
            }

            if (currentPage === 1) {
                if (data.optimized_query && data.optimized_query !== currentQuery) {
                    setStatus(`已优化关键词: ${data.optimized_query}`);
                } else {
                    setStatus('搜索完成');
                }

                // Trigger AI Summary if API key is present and we have results
                if (settings.apiKey && data.results && data.results.length > 0) {
                    doAiSummary(currentQuery, data.results, settings);
                }
            }

            if (data.results && data.results.length > 0) {
                setResults((prev) => isLoadMore ? [...prev, ...data.results] : data.results);
                setPage(currentPage);
                setHasMore(true);
            } else {
                if (currentPage === 1) {
                    setStatus('未找到相关结果');
                } else {
                    setHasMore(false);
                }
            }

        } catch (e) {
            setStatus(`错误: ${e.message}`);
        } finally {
            setIsSearching(false);
            setIsLoadingMore(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            executeSearch(false);
        }
    };

    // Safe inner HTML rendering for bolding query matches (usually backend handles this by returning text)
    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <SearchIcon size={32} /> AI 搜索
                </h2>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflowY: 'auto' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="输入搜索问题..."
                        style={{ flex: 1, padding: '1.2rem', borderRadius: '0.8rem', border: '1px solid var(--border)', background: 'var(--bg-darker)', color: 'white', fontSize: '1.3rem' }}
                    />
                    <button
                        onClick={() => executeSearch(false)}
                        disabled={isSearching || !query.trim()}
                        className="primary-btn"
                        style={{ width: 'auto', padding: '0 2.5rem', fontSize: '1.3rem', opacity: isSearching || !query.trim() ? 0.6 : 1 }}
                    >
                        搜索
                    </button>
                </div>

                {status && (
                    <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {status}
                    </div>
                )}

                {aiSummary && (
                    <div style={{ background: 'var(--bg-darker)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.2rem', marginBottom: '1.5rem' }}>
                        <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc', marginBottom: '0.8rem' }}>
                            <Sparkles size={18} /> AI 智能总结
                        </h4>
                        <div style={{ lineHeight: '1.6', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                            {aiSummary}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {results.map((r, i) => (
                        <div key={i} style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                <a href={r.href} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                                    {i + 1}. {r.title}
                                </a>
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>
                                {r.body}
                            </p>
                        </div>
                    ))}
                </div>

                {hasMore && (
                    <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingBottom: '1rem' }}>
                        <button
                            onClick={() => executeSearch(true)}
                            disabled={isLoadingMore}
                            className="primary-btn"
                            style={{ background: 'var(--bg-darker)', border: '1px solid var(--border)', width: 'auto', opacity: isLoadingMore ? 0.6 : 1 }}
                        >
                            {isLoadingMore ? '加载中...' : '加载更多'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
