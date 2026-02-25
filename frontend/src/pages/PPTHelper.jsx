import React, { useState, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Presentation, Play, Download, Menu, Edit3, Save } from 'lucide-react';

export const PPTHelper = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};

    const [topic, setTopic] = useState('');
    const [status, setStatus] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [outline, setOutline] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleGenerateOutline = async () => {
        if (!topic.trim() || isGenerating) return;
        setIsGenerating(true);
        setStatus('正在构思 PPT 大纲...');
        setOutline(null);

        const provider = localStorage.getItem('llm_provider') || 'OpenRouter';
        const model = localStorage.getItem('llm_model') || '';
        const apiKey = localStorage.getItem('llm_key') || '';
        const baseUrl = localStorage.getItem('llm_base_url') || '';

        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/generate/ppt/outline', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    topic,
                    provider,
                    model,
                    api_key: apiKey,
                    base_url: baseUrl || null
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || '生成大纲失败');
            }

            const res = await response.json();
            if (res.data) {
                setOutline(res.data);
                setStatus('大纲已生成，您可以进行修改。');
            } else {
                // Handle streaming or plain text if necessary
                throw new Error('未返回有效的大纲数据');
            }
        } catch (e) {
            setStatus(`错误: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreatePPT = async () => {
        if (!outline || isCreating) return;
        setIsCreating(true);
        setStatus('正在生成 PPT 文件...');

        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/generate/ppt/create', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ data: outline })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || '生成文件失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${topic.replace(/\s/g, '_') || 'presentation'}.pptx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            setStatus('✅ PPT 生成成功并已开始下载');
        } catch (e) {
            setStatus(`错误: ${e.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const updateSlideContent = (index, field, value) => {
        const newOutline = { ...outline };
        newOutline.slides[index][field] = value;
        setOutline(newOutline);
    };

    const updateSlidePoint = (sIdx, pIdx, value) => {
        const newOutline = { ...outline };
        newOutline.slides[sIdx].content[pIdx] = value;
        setOutline(newOutline);
    };

    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <Presentation size={32} /> AI PPT 助手
                </h2>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                        placeholder="输入 PPT 主题，例如：2026年人工智能发展趋势"
                        style={{ flex: 1, padding: '1.2rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', fontSize: '1.3rem' }} />
                    <button onClick={handleGenerateOutline} disabled={isGenerating || !topic.trim()}
                        className="primary-btn" style={{ width: 'auto', padding: '0 2.5rem', display: 'flex', gap: '0.8rem', alignItems: 'center', opacity: (isGenerating || !topic.trim()) ? 0.6 : 1, fontSize: '1.3rem' }}>
                        <Play size={28} /> {isGenerating ? '正在构思...' : '生成大纲'}
                    </button>
                </div>

                {status && <div style={{ marginBottom: '1rem', padding: '0.8rem', borderRadius: '0.4rem', background: status.includes('错误') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(165, 180, 252, 0.1)', color: status.includes('错误') ? '#fca5a5' : '#a5b4fc', fontSize: '0.9rem', border: '1px solid currentColor' }}>{status}</div>}

                {outline && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Edit3 size={20} /> 大纲预览与编辑</h3>
                            <button onClick={handleCreatePPT} disabled={isCreating} className="primary-btn" style={{ width: 'auto', background: '#22c55e', padding: '0.6rem 1.2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <Download size={18} /> {isCreating ? '生成中...' : '生成并下载 PPTX'}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {outline.slides.map((slide, sIdx) => (
                                <div key={sIdx} style={{ padding: '1rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                                    <div style={{ marginBottom: '1.2rem' }}>
                                        <label style={{ fontSize: '1rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>第 {sIdx + 1} 页标题</label>
                                        <input type="text" value={slide.title} onChange={e => updateSlideContent(sIdx, 'title', e.target.value)}
                                            style={{ width: '100%', padding: '0.8rem', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '1rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>正文要点</label>
                                        {slide.content.map((point, pIdx) => (
                                            <input key={pIdx} type="text" value={point} onChange={e => updateSlidePoint(sIdx, pIdx, e.target.value)}
                                                style={{ width: '100%', padding: '0.8rem', background: '#111', border: '1px solid #222', color: '#ccc', borderRadius: '0.5rem', fontSize: '1.1rem', marginBottom: '8px' }} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!outline && !isGenerating && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: '1rem', color: 'var(--text-muted)', margin: '2rem 0' }}>
                        输入主题开始创作 PPT
                    </div>
                )}
            </div>
        </div>
    );
};
