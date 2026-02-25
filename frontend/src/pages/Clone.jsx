import React, { useState, useRef, useEffect, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Send, Users, UserPlus, Undo2, Menu, FileText, Upload, FolderSearch, PenLine } from 'lucide-react';

export const Clone = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};

    // App states
    const [mode, setMode] = useState('setup'); // 'setup' | 'chat'

    // Character setup states
    const [charName, setCharName] = useState('');
    const [charPersonality, setCharPersonality] = useState('');
    const [charBackground, setCharBackground] = useState('');

    // Import & Analysis states
    const [importMode, setImportMode] = useState('manual');
    const [analyzeText, setAnalyzeText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [localFiles, setLocalFiles] = useState([]);
    const [selectedLocalFile, setSelectedLocalFile] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (importMode === 'local' && localFiles.length === 0) {
            fetch('/api/persona/local_scan', {
                headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
            })
                .then(res => res.json())
                .then(data => {
                    if (data.files) setLocalFiles(data.files);
                })
                .catch(e => console.error("Failed to load local files:", e));
        }
    }, [importMode, authToken, localFiles.length]);

    const handleAnalyze = async () => {
        const provider = localStorage.getItem('llm_provider') || 'OpenRouter';
        const model = localStorage.getItem('llm_model') || '';
        const apiKey = localStorage.getItem('llm_key') || '';
        const baseUrl = localStorage.getItem('llm_base_url') || '';

        const formData = new FormData();
        formData.append('provider', provider);
        formData.append('model', model);
        formData.append('api_key', apiKey);
        if (baseUrl) formData.append('base_url', baseUrl);

        let endpoint = '';
        if (importMode === 'text') {
            if (!analyzeText.trim()) return alert('请输入需要分析的聊天记录');
            endpoint = '/api/persona/analyze_text';
            formData.append('text', analyzeText);
        } else if (importMode === 'file') {
            if (!selectedFile) return alert('请先选择文件');
            endpoint = '/api/persona/analyze';
            formData.append('file', selectedFile);
        } else if (importMode === 'local') {
            if (!selectedLocalFile) return alert('请选择一个本地备份文件');
            endpoint = '/api/persona/import_local';
            formData.append('path', selectedLocalFile);
        }

        setIsAnalyzing(true);
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
                body: formData
            });
            if (!res.ok) {
                let errText = await res.text();
                try { errText = JSON.parse(errText).detail || errText; } catch (e) { }
                throw new Error(errText);
            }
            const data = await res.json();
            setCharBackground(data.system_prompt || '');
            setImportMode('manual');
            alert('分析成功！人设系统词已自动填入下方背景框。');
        } catch (e) {
            alert('分析失败: ' + e.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Chat states
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const historyEndRef = useRef(null);

    useEffect(() => {
        if (mode === 'chat') {
            historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, mode]);

    const handleStartChat = () => {
        if (!charName.trim()) {
            alert("请输入角色名称");
            return;
        }
        setMode('chat');
        // Initialize system prompt based on user input
        setMessages([
            { role: 'assistant', content: `你好！我是${charName}。我们开始聊天吧！` }
        ]);
    };

    const handleSend = async () => {
        const text = inputMessage.trim();
        if (!text || isTyping) return;

        setInputMessage('');
        setIsTyping(true);

        const newMessages = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);

        const provider = localStorage.getItem('llm_provider') || 'OpenRouter';
        const model = localStorage.getItem('llm_model') || '';
        const apiKey = localStorage.getItem('llm_key') || '';
        const baseUrl = localStorage.getItem('llm_base_url') || '';

        // Build the injected system prompt for the character
        const systemPrompt = `你现在要扮演一个角色：
姓名：${charName}
性格特点：${charPersonality || '未说明'}
背景设定：${charBackground || '未说明'}
请完全沉浸在这个角色中，用TA的语气和思维方式回答我的所有问题，不要暴露你是一个AI。`;

        const requestMessages = [
            { role: 'system', content: systemPrompt },
            // Skip the first greeting message from history if preferred, or keep it. 
            // We will keep the whole history for context.
            ...newMessages
        ];

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    messages: requestMessages,
                    provider: provider,
                    model: model,
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

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                fullResponse += chunk;

                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullResponse };
                    return updated;
                });
            }
        } catch (e) {
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: updated[updated.length - 1].content + `\n\n[Error: ${e.message}]` };
                return updated;
            });
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <Users size={32} /> AI 角色克隆
                </h2>
                {mode === 'chat' && (
                    <button
                        onClick={() => setMode('setup')}
                        className="primary-btn"
                        style={{ marginLeft: 'auto', background: 'var(--bg-darker)', border: '1px solid var(--border)', width: 'auto', padding: '0.8rem 1.5rem', display: 'flex', gap: '8px', fontSize: '1.2rem' }}
                    >
                        <Undo2 size={24} /> 重新设定
                    </button>
                )}
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>

                {mode === 'setup' && (
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto', width: '100%', paddingTop: '2rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <UserPlus size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                            <h3>定制你的专属 AI 伴侣</h3>
                            <p style={{ color: 'var(--text-muted)' }}>赋予 AI 独特的名字、性格和身份背景，开启沉浸式对话体验。</p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button onClick={() => setImportMode('manual')} style={{ padding: '0.8rem 1.2rem', background: importMode === 'manual' ? 'var(--primary)' : 'var(--bg-darker)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><PenLine size={20} /> 手动录入</button>
                            <button onClick={() => setImportMode('text')} style={{ padding: '0.8rem 1.2rem', background: importMode === 'text' ? 'var(--primary)' : 'var(--bg-darker)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><FileText size={20} /> 文本提取</button>
                            <button onClick={() => setImportMode('file')} style={{ padding: '0.8rem 1.2rem', background: importMode === 'file' ? 'var(--primary)' : 'var(--bg-darker)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><Upload size={20} /> 文件上传</button>
                            <button onClick={() => setImportMode('local')} style={{ padding: '0.8rem 1.2rem', background: importMode === 'local' ? 'var(--primary)' : 'var(--bg-darker)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><FolderSearch size={20} /> 本地扫描</button>
                        </div>

                        {importMode !== 'manual' && (
                            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px dashed var(--border)', marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
                                {importMode === 'text' && (
                                    <>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>粘贴聊天记录以归纳性格</label>
                                        <textarea
                                            value={analyzeText}
                                            onChange={e => setAnalyzeText(e.target.value)}
                                            placeholder="粘贴多句该角色的历史发言对话，AI将自动捕捉习惯与性格..."
                                            style={{ width: '100%', minHeight: '120px', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-darker)', color: 'white', resize: 'vertical' }}
                                        />
                                    </>
                                )}
                                {importMode === 'file' && (
                                    <>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>上传聊天记录 (支持txt等)</label>
                                        <input
                                            type="file"
                                            onChange={e => setSelectedFile(e.target.files[0])}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-darker)', color: 'white' }}
                                        />
                                    </>
                                )}
                                {importMode === 'local' && (
                                    <>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>从服务器已配置的备份列表中选择</label>
                                        <select
                                            value={selectedLocalFile}
                                            onChange={e => setSelectedLocalFile(e.target.value)}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-darker)', color: 'white' }}
                                        >
                                            <option value="">-- 请选择备份文件 --</option>
                                            {localFiles.map((f, i) => <option key={i} value={f}>{f}</option>)}
                                        </select>
                                    </>
                                )}
                                <button onClick={handleAnalyze} disabled={isAnalyzing} className="primary-btn" style={{ marginTop: '1rem', width: '100%', opacity: isAnalyzing ? 0.7 : 1 }}>
                                    {isAnalyzing ? '正在由 AI 大模型分析生成中...' : '提交分析'}
                                </button>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>角色名称 <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                                type="text"
                                value={charName}
                                onChange={(e) => setCharName(e.target.value)}
                                placeholder="例如：苏格拉底、爱因斯坦、或者你创造的任何名字"
                                style={{ width: '100%', padding: '1.2rem', borderRadius: '0.8rem', border: '1px solid var(--border)', background: 'var(--bg-darker)', color: 'white', fontSize: '1.25rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>性格特点</label>
                            <input
                                type="text"
                                value={charPersonality}
                                onChange={(e) => setCharPersonality(e.target.value)}
                                placeholder="例如：傲娇、幽默、严谨、温柔且善解人意..."
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-darker)', color: 'white' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>背景设定 & 细节指令</label>
                            <textarea
                                value={charBackground}
                                onChange={(e) => setCharBackground(e.target.value)}
                                placeholder="描述角色的身世背景、口头禅、以及不可逾越的设定边界。比如：你是一个来自2077年的机器人，说话喜欢带电流声..."
                                style={{ width: '100%', minHeight: '120px', padding: '0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-darker)', color: 'white', resize: 'vertical' }}
                            />
                        </div>

                        <button onClick={handleStartChat} className="primary-btn" style={{ padding: '1.25rem', fontSize: '1.4rem', marginTop: '1rem' }}>
                            召唤角色并开始对话
                        </button>
                    </div>
                )}

                {mode === 'chat' && (
                    <>
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.5rem' }}>
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    style={{
                                        marginBottom: '1rem',
                                        padding: '0.8rem 1rem',
                                        borderRadius: '0.8rem',
                                        maxWidth: '90%',
                                        lineHeight: '1.6',
                                        fontSize: '1.25rem',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        ...(msg.role === 'user'
                                            ? { marginLeft: 'auto', backgroundColor: 'var(--primary)', color: 'white' }
                                            : { marginRight: 'auto', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-color)' })
                                    }}
                                >
                                    {msg.content}
                                </div>
                            ))}
                            <div ref={historyEndRef} />
                        </div>

                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-end' }}>
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`和 ${charName} 聊天... (Enter 发送)`}
                                style={{
                                    flex: 1, padding: '1.2rem', borderRadius: '0.8rem', border: '1px solid var(--border)',
                                    background: 'var(--bg-darker)', color: 'white', resize: 'none',
                                    minHeight: '3.5rem', maxHeight: '15rem', fontFamily: 'inherit', lineHeight: '1.5', fontSize: '1.3rem'
                                }}
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isTyping || !inputMessage.trim()}
                                className="primary-btn"
                                style={{
                                    width: 'auto', padding: '0 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: (isTyping || !inputMessage.trim()) ? 0.6 : 1,
                                    cursor: (isTyping || !inputMessage.trim()) ? 'not-allowed' : 'pointer', height: '4.5rem'
                                }}
                            >
                                <Send size={28} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
