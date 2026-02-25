import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, MessageCircle, Menu } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const FreeChat = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const historyEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = inputMessage.trim();
        if (!text || isTyping) return;

        setInputMessage('');
        setIsTyping(true);

        // Initial new message array with User message
        const newMessages = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);

        // Read settings from localStorage
        const provider = localStorage.getItem('llm_provider') || 'OpenRouter';
        const model = localStorage.getItem('llm_model') || '';
        const apiKey = localStorage.getItem('llm_key') || '';
        const baseUrl = localStorage.getItem('llm_base_url') || '';
        const sysPrompt = localStorage.getItem('llm_sys_prompt') || '';

        // Build Request Messages with Context
        let systemContent = `[System Info] Current Model: ${model || 'Default'}`;
        if (sysPrompt) {
            systemContent += "\n" + sysPrompt.trim();
        }
        const requestMessages = [
            { role: 'system', content: systemContent },
            ...newMessages
        ];

        // Placeholder for AI Response
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        const headers = {
            'Content-Type': 'application/json',
        };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`; // Forward Auth token
        }

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

                // Update the last assistant message
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
                <h2 id="page-title" style={{ margin: 0, fontSize: '2rem' }}>AI 对话</h2>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>

                {/* Chat History Area */}
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.5rem' }}>
                    {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '6rem' }}>
                            <MessageCircle size={64} style={{ opacity: 0.5, marginBottom: '1.5rem' }} />
                            <p style={{ fontSize: '1.4rem' }}>和满血大模型自由对话</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
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
                        ))
                    )}
                    <div ref={historyEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="随便聊点什么... (Enter 发送)"
                        style={{
                            flex: 1,
                            padding: '1.2rem',
                            borderRadius: '0.8rem',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-darker)',
                            color: 'white',
                            resize: 'none',
                            minHeight: '3.5rem',
                            maxHeight: '15rem',
                            fontFamily: 'inherit',
                            lineHeight: '1.5',
                            fontSize: '1.3rem'
                        }}
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isTyping || !inputMessage.trim()}
                        className="primary-btn"
                        style={{
                            width: 'auto',
                            padding: '0 2.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: (isTyping || !inputMessage.trim()) ? 0.6 : 1,
                            cursor: (isTyping || !inputMessage.trim()) ? 'not-allowed' : 'pointer',
                            height: '4.5rem'
                        }}
                    >
                        <Send size={28} />
                    </button>
                </div>

            </div>
        </div>
    );
};
