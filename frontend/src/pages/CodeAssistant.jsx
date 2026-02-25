import React, { useState, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, Code2, Play } from 'lucide-react';

export const CodeAssistant = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};
    const [lang, setLang] = useState('Python');
    const [task, setTask] = useState('generate');
    const [content, setContent] = useState('');
    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!content.trim() || isGenerating) return;

        setIsGenerating(true);
        setResult('AI 正在思考...');

        const provider = localStorage.getItem('llm_provider') || 'OpenRouter';
        const model = localStorage.getItem('llm_model') || '';
        const apiKey = localStorage.getItem('llm_key') || '';
        const baseUrl = localStorage.getItem('llm_base_url') || '';

        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        try {
            const response = await fetch('/api/code/generate', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    task,
                    language: lang,
                    content,
                    provider,
                    model,
                    api_key: apiKey,
                    base_url: baseUrl || null
                })
            });

            if (!response.ok) {
                let errorText = await response.text();
                try { errorText = JSON.parse(errorText).detail || errorText; } catch (e) { }
                throw new Error(errorText || `HTTP Error ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = "";
            setResult("");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                fullResponse += chunk;
                setResult(fullResponse);
            }
        } catch (e) {
            setResult(`Error: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const languages = ['Python', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin', 'SQL', 'Shell', 'VBA'];
    const tasks = [
        { value: 'generate', label: ' 生成代码' },
        { value: 'review', label: ' 审查代码' },
        { value: 'debug', label: ' 调试 Bug' },
        { value: 'explain', label: ' 解释代码' }
    ];

    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <Code2 size={32} /> ️代码助手
                </h2>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        style={{ flex: 1, padding: '1.2rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', fontSize: '1.3rem' }}
                    >
                        {languages.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        style={{ flex: 1, padding: '1.2rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', fontSize: '1.3rem' }}
                    >
                        {tasks.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="描述需求或粘贴代码..."
                    style={{
                        width: '100%',
                        minHeight: '200px',
                        padding: '1.5rem',
                        background: 'var(--bg-darker)',
                        border: '1px solid var(--border)',
                        color: 'white',
                        marginBottom: '1.5rem',
                        borderRadius: '0.8rem',
                        resize: 'vertical',
                        fontFamily: 'monospace',
                        fontSize: '1.2rem'
                    }}
                />

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !content.trim()}
                    className="primary-btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.8rem',
                        padding: '1.2rem',
                        fontSize: '1.4rem',
                        opacity: (isGenerating || !content.trim()) ? 0.6 : 1,
                        cursor: (isGenerating || !content.trim()) ? 'not-allowed' : 'pointer'
                    }}
                >
                    <Play size={28} /> 执行任务
                </button>

                {result && (
                    <div style={{
                        marginTop: '1.5rem',
                        background: '#1e1e1e',
                        padding: '1.5rem',
                        borderRadius: '0.8rem',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '1.15rem',
                        lineHeight: '1.6',
                        border: '1px solid #333'
                    }}>
                        {result}
                    </div>
                )}
            </div>
        </div>
    );
};
