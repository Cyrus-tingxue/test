import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose }) => {
    const [provider, setProvider] = useState('OpenRouter');
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [sysPrompt, setSysPrompt] = useState('');

    useEffect(() => {
        if (isOpen) {
            setProvider(localStorage.getItem('llm_provider') || 'OpenRouter');
            setModel(localStorage.getItem('llm_model') || '');
            setApiKey(localStorage.getItem('llm_key') || '');
            setBaseUrl(localStorage.getItem('llm_base_url') || '');
            setSysPrompt(localStorage.getItem('llm_sys_prompt') || '');
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('llm_provider', provider);
        localStorage.setItem('llm_model', model);
        localStorage.setItem('llm_key', apiKey);
        localStorage.setItem('llm_base_url', baseUrl);
        localStorage.setItem('llm_sys_prompt', sysPrompt);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>模型配置</h3>
                    <button onClick={onClose} className="close-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>模型提供者</label>
                        <select
                            value={provider}
                            onChange={e => setProvider(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.5rem' }}
                        >
                            <option value="OpenAI">OpenAI</option>
                            <option value="Anthropic">Anthropic</option>
                            <option value="Google">Google</option>
                            <option value="SiliconCloud">SiliconCloud</option>
                            <option value="OpenRouter">OpenRouter</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>模型名称</label>
                        <input
                            type="text"
                            value={model}
                            onChange={e => setModel(e.target.value)}
                            placeholder="模型名称（留空使用默认）"
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.5rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.5rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>API Base URL (可选)</label>
                        <input
                            type="text"
                            value={baseUrl}
                            onChange={e => setBaseUrl(e.target.value)}
                            placeholder="https://api.example.com/v1"
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.5rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>自定义系统提示词 (System Prompt)</label>
                        <textarea
                            value={sysPrompt}
                            onChange={e => setSysPrompt(e.target.value)}
                            placeholder="例如：你是一个海盗，用海盗的口吻说话。"
                            style={{ width: '100%', height: '80px', padding: '0.8rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.5rem', resize: 'vertical' }}
                        />
                    </div>
                </div>
                <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} className="primary-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <Save size={18} /> 保存配置
                    </button>
                </div>
            </div>
        </div>
    );
};
