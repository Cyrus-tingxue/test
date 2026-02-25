import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, UserPlus, Search, Code, Sparkles, Table, RefreshCw, BarChart2, BrainCircuit, Presentation, Gamepad2, LogIn, LogOut, Settings, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const NAV_CONFIG = [
    {
        group: null,
        items: [{ key: '', label: '首页', icon: Home }]
    },
    {
        group: 'AI 工具',
        items: [
            { key: 'free_chat', label: 'AI 对话', icon: MessageCircle },
            { key: 'clone', label: 'AI 角色克隆', icon: UserPlus },
            { key: 'search', label: 'AI 搜索', icon: Search },
            { key: 'code', label: '代码助手', icon: Code }
        ]
    },
    {
        group: '智能办公',
        items: [
            { key: 'creative', label: '创作工坊', icon: Sparkles },
            { key: 'excel', label: 'Excel 助手', icon: Table },
            { key: 'converter', label: '格式转换', icon: RefreshCw },
            { key: 'viz', label: '数据可视化', icon: BarChart2 },
            { key: 'mindmap', label: '思维导图', icon: BrainCircuit },
            { key: 'ppt', label: 'AI PPT', icon: Presentation }
        ]
    },
    {
        group: '摸鱼专区',
        items: [
            { key: 'game', label: '文字冒险', icon: Gamepad2 }
        ]
    }
];

export const Sidebar = ({ isOpen, toggleSidebar, onOpenSettings }) => {
    const { authToken, username, logout } = useContext(AuthContext);

    return (
        <>
            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} id="sidebar">
                <div className="brand">
                    <span className="logo-icon"></span>
                    <div className="brand-text">
                        <h1>AI办公助手</h1>
                        <span className="version">Made by Cyrus</span>
                    </div>
                </div>

                <nav id="nav-menu">
                    {NAV_CONFIG.map((group, idx) => (
                        <div key={idx}>
                            {group.group && <div className="nav-group-label">{group.group}</div>}
                            {group.items.map(item => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.key}
                                        to={`/${item.key}`}
                                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => { if (window.innerWidth <= 768) toggleSidebar(); }}
                                    >
                                        <Icon size={24} /> {item.label}
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                </nav>


                <div className="settings-trigger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button id="settings-btn" onClick={onOpenSettings} style={{
                        flex: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.6rem 0.8rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#f87171',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}>
                        <Settings size={18} /> 配置
                    </button>
                    {authToken ? (
                        <button onClick={logout} style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0.6rem 0.8rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#f87171',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            <User size={18} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{username}</span>
                            <LogOut size={16} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                        </button>
                    ) : (
                        <NavLink to="/login" style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0.6rem 0.8rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#f87171',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap'
                        }}>
                            <LogIn size={18} /> 登录
                        </NavLink>
                    )}
                </div>
            </aside>

            {/* Sidebar Overlay (mobile) */}
            <div
                id="sidebar-overlay"
                className={isOpen ? 'active' : ''}
                style={{ display: isOpen ? 'block' : 'none' }}
                onClick={toggleSidebar}
            ></div>
        </>
    );
};
