import React, { useState, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Terminal, AlertTriangle, Code, Play, CheckCircle, Menu } from 'lucide-react';

export const SystemControl = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};

    const [query, setQuery] = useState('');
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [step, setStep] = useState(1); // 1: Input, 2: Review Code

    const handleGenerateCode = async () => {
        if (!query.trim() || isGenerating) return;
        setIsGenerating(true);
        setStep(1);

        const provider = localStorage.getItem('llm_provider') || 'OpenRouter';
        const model = localStorage.getItem('llm_model') || '';
        const apiKey = localStorage.getItem('llm_key') || '';
        const baseUrl = localStorage.getItem('llm_base_url') || '';

        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/system/generate_code', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    query,
                    provider,
                    model,
                    api_key: apiKey,
                    base_url: baseUrl || null
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || '生成代码失败');
            }

            const res = await response.json();
            setCode(res.code);
            setStep(2);
        } catch (e) {
            setOutput(`[错误] ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExecuteCode = async () => {
        if (!code.trim() || isExecuting) return;
        if (!window.confirm("请确认：您正准备在服务器上执行 Python 代码。这可能会修改或删除文件，是否继续？")) return;

        setIsExecuting(true);
        setOutput('正在执行...');

        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/system/execute_code', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ code })
            });

            const res = await response.json();
            if (response.ok) {
                setOutput(res.output || '命令已执行，无标准输出。');
            } else {
                setOutput(`[执行失败] ${res.detail}`);
            }
        } catch (e) {
            setOutput(`[网络错误] ${e.message}`);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <Terminal size={32} /> 系统控制 (Beta)
                </h2>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '0.8rem', marginBottom: '2rem', display: 'flex', gap: '16px' }}>
                    <AlertTriangle color="#f87171" size={48} style={{ flexShrink: 0 }} />
                    <div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#f87171', fontSize: '1.4rem' }}>高风险操作警告</h4>
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#fca5a5', opacity: 0.9, lineHeight: '1.6' }}>
                            此功能允许通过自然语言驱动 AI 生成并执行 Python 代码。您可以用来批量重命名文件、搬运数据、甚至执行复杂的系统运维任务。执行前请务必仔细检查 AI 生成的代码。
                        </p>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>请输入您的运维需求：</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <textarea
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="例如：列出当前目录下的所有 .py 文件，并统计它们的行数。"
                            style={{ flex: 1, height: '120px', padding: '1.2rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', resize: 'none', fontSize: '1.2rem' }}
                        />
                        <button onClick={handleGenerateCode} disabled={isGenerating || !query.trim()}
                            className="primary-btn" style={{ width: 'auto', padding: '0 2.5rem', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '1.3rem' }}>
                            <Code size={28} /> {isGenerating ? '思考中...' : '生成代码'}
                        </button>
                    </div>
                </div>

                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={18} color="#10b981" /> 检查生成的代码</h4>
                            <button onClick={handleExecuteCode} disabled={isExecuting} className="primary-btn" style={{ background: '#ef4444', width: 'auto', padding: '0.5rem 1.2rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <Play size={18} /> {isExecuting ? '正在执行...' : '确认并执行'}
                            </button>
                        </div>
                        <textarea
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            style={{ flex: 1, minHeight: '200px', padding: '1rem', background: '#111', border: '1px solid #333', color: '#a5b4fc', fontFamily: 'monospace', borderRadius: '0.5rem', fontSize: '0.95rem' }}
                        />
                    </div>
                )}

                {output && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)' }}>运行输出：</h4>
                        <pre style={{ padding: '1rem', background: 'black', color: '#10b981', border: '1px solid #333', borderRadius: '0.5rem', overflowX: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                            {output}
                        </pre>
                    </div>
                )}

                {step === 1 && !isGenerating && !output && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: '1rem', color: 'var(--text-muted)', margin: '2rem 0' }}>
                        等待输入运维指令...
                    </div>
                )}
            </div>
        </div>
    );
};
