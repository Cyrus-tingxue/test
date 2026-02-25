import React, { useState, useContext, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Gamepad2, Send, RotateCcw, Heart, MapPin, Package, Info, Menu } from 'lucide-react';

const SCENARIOS = [
    {
        id: 'rules_horror',
        name: '规则怪谈',
        desc: '你穿越到了一个充满诡异规则的世界。遵守规则是生存的唯一方式，但规则本身......可能是假的。',
        icon: '👁️',
        bg: 'linear-gradient(135deg, #000000 0%, #434343 100%)'
    },
    {
        id: 'xiuxian',
        name: '修仙模拟器',
        desc: '凡人修仙，逆天改命。从炼气期开始你的长生之路。',
        icon: '🧘',
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
        icon: '🦾',
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

export const Game = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};

    const [gameState, setGameState] = useState(null);
    const [inputAction, setInputAction] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const logRef = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem('adventure_save_data');
        if (saved) {
            try {
                setGameState(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load save data", e);
            }
        }
    }, []);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [gameState?.messages]);

    const saveState = (newState) => {
        localStorage.setItem('adventure_save_data', JSON.stringify(newState));
        setGameState(newState);
    };

    const startAdventure = async (scenarioId) => {
        const scenario = SCENARIOS.find(s => s.id === scenarioId);
        const initialState = {
            setting: `${scenario.name} - ${scenario.desc}`,
            hp: 100,
            max_hp: 100,
            inventory: ["新手礼包"],
            location: "起始之地",
            status: "健康",
            history: [],
            messages: [],
            last_choices: []
        };

        setGameState(initialState);
        await performAction(`我醒来了。这里是哪里？(背景：${scenario.name})`, initialState);
    };

    const performAction = async (actionText, currentState = gameState) => {
        if (!actionText || isLoading) return;

        setIsLoading(true);
        setInputAction('');

        // Optimistic User Message
        const updatedMessages = [...(currentState?.messages || []), { role: 'user', content: actionText }];
        const interimState = { ...currentState, messages: updatedMessages };
        setGameState(interimState);

        const provider = localStorage.getItem('llm_provider') || 'OpenRouter';
        const model = localStorage.getItem('llm_model') || '';
        const apiKey = localStorage.getItem('llm_key') || '';
        const baseUrl = localStorage.getItem('llm_base_url') || '';

        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/game/adventure', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    pet_state: {
                        world_setting: currentState.setting,
                        hp: currentState.hp,
                        max_hp: currentState.max_hp,
                        inventory: currentState.inventory,
                        location: currentState.location,
                        status: currentState.status
                    },
                    user_input: currentState.history || [],
                    action: actionText,
                    provider,
                    model,
                    api_key: apiKey,
                    base_url: baseUrl || null
                })
            });

            if (!response.ok) {
                const err = await response.json();
                let errMsg = err.detail || '游戏服务器无响应';
                if (Array.isArray(errMsg)) {
                    errMsg = errMsg.map(d => d.msg || JSON.stringify(d)).join('; ');
                } else if (typeof errMsg === 'object') {
                    errMsg = JSON.stringify(errMsg);
                }
                throw new Error(errMsg);
            }

            const res = await response.json();

            const newState = {
                ...currentState,
                hp: res.state_update?.hp ?? currentState.hp,
                inventory: res.state_update?.inventory ?? currentState.inventory,
                location: res.state_update?.location ?? currentState.location,
                status: res.state_update?.status ?? currentState.status,
                history: [...(currentState.history || []), { role: 'user', content: actionText }, { role: 'assistant', content: res.plot }],
                messages: [...updatedMessages, { role: 'assistant', content: res.plot }],
                last_choices: res.choices || []
            };

            // Limit history to 20 for context
            if (newState.history.length > 20) {
                newState.history = newState.history.slice(-20);
            }

            saveState(newState);
        } catch (e) {
            setGameState({
                ...interimState,
                messages: [...updatedMessages, { role: 'assistant', content: `[系统错误] ${e.message}` }]
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        if (window.confirm("确定要删除当前存档并重开吗？此操作无法撤销。")) {
            localStorage.removeItem('adventure_save_data');
            setGameState(null);
        }
    };

    if (!gameState) {
        return (
            <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <header id="page-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                    <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.25rem', display: 'flex', marginRight: '1rem' }}>
                        <Menu size={20} />
                    </button>
                    <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Gamepad2 size={24} /> 文字冒险
                    </h2>
                </header>
                <div className="card" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ margin: 'auto', width: '100%', maxWidth: '1200px' }}>
                        <h2 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>选择你的平行宇宙</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>AI 实时生成的无限文字冒险。每一次选择，都是全新的历史。</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', margin: '0 auto' }}>
                            {SCENARIOS.map(s => (
                                <div key={s.id} onClick={() => startAdventure(s.id)}
                                    style={{
                                        background: s.bg,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '1.5rem',
                                        padding: '2.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                        textAlign: 'left',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minHeight: '280px',
                                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                        e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(185, 28, 28, 0.3)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.5)';
                                    }}>
                                    <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }}>{s.icon}</div>
                                    <h3 style={{ marginBottom: '1rem', color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>{s.name}</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', lineHeight: '1.8', margin: 0, flex: 1 }}>{s.desc}</p>
                                    <div style={{ position: 'absolute', bottom: '-1.5rem', right: '-1rem', opacity: 0.05, fontSize: '8rem', pointerEvents: 'none' }}>{s.icon}</div>
                                    <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        点击进入冒险 →
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        );
    }

    return (
        <div style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
            {/* HUD Bar */}
            <div style={{ padding: '0.8rem 1.5rem', background: 'rgba(30, 41, 59, 0.9)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontWeight: 'bold', fontSize: '1.3rem' }}>
                        <Heart size={22} fill="#f43f5e" /> HP: {gameState.hp}/{gameState.max_hp}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontSize: '1.3rem' }}>
                        <MapPin size={22} /> {gameState.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#eab308', fontSize: '1.3rem' }}>
                        <Package size={22} /> 包裹
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={handleReset} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.5rem 1.2rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <RotateCcw size={18} /> 重开
                    </button>
                </div>
            </div>

            {/* Adventure Log */}
            <div ref={logRef} style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', scrollBehavior: 'smooth' }}>
                {gameState.messages.map((msg, idx) => (
                    <div key={idx} style={{ animation: 'fadeIn 0.5s' }}>
                        {msg.role === 'user' ? (
                            <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.6rem', paddingBottom: '0.8rem', borderBottom: '2px solid rgba(185, 28, 28, 0.3)' }}>
                                {`> ${msg.content}`}
                            </div>
                        ) : (
                            <div style={{ lineHeight: '1.9', color: '#f1f5f9', whiteSpace: 'pre-wrap', fontSize: '1.5rem', letterSpacing: '0.01em' }}>
                                {msg.content}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div> DM 正在思考命运的走向...
                    </div>
                )}
            </div>

            {/* Action Area */}
            <div style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.8)', borderTop: '1px solid var(--border)' }}>
                {gameState.last_choices && gameState.last_choices.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.8rem', flexWrap: 'wrap' }}>
                        {gameState.last_choices.map((choice, i) => (
                            <button key={i} onClick={() => performAction(choice)} disabled={isLoading}
                                style={{ whiteSpace: 'normal', minWidth: '120px', padding: '1rem 1.8rem', background: 'rgba(185, 28, 28, 0.1)', border: '2px solid var(--primary)', color: 'white', borderRadius: '1rem', cursor: 'pointer', fontSize: '1.3rem', fontWeight: 'bold', transition: 'all 0.2s', textAlign: 'left' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(185, 28, 28, 0.2)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(185, 28, 28, 0.1)'}>
                                {choice}
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <input type="text" value={inputAction} onChange={e => setInputAction(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && performAction(inputAction)}
                        placeholder="你想做什么？..."
                        style={{ flex: 1, padding: '1.4rem 1.8rem', fontSize: '1.4rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg-darker)', color: 'white', outline: 'none' }} />
                    <button onClick={() => performAction(inputAction)} disabled={isLoading || !inputAction.trim()}
                        className="primary-btn" style={{ width: 'auto', padding: '0 3rem', borderRadius: '1rem', opacity: (isLoading || !inputAction.trim()) ? 0.6 : 1 }}>
                        <Send size={28} />
                    </button>
                </div>
            </div>
        </div >
    );
};
