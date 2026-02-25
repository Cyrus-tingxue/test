import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { User, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export const UserNav = () => {
    const { authToken, username, logout } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!authToken) {
        return (
            <div style={{
                position: 'fixed',
                top: '2rem',
                right: '2.5rem',
                zIndex: 1000,
                animation: 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}>
                <NavLink to="/login" className="premium-nav-btn" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '1rem 2rem',
                    background: 'rgba(185, 28, 28, 0.1)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '3rem',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    boxShadow: '0 8px 32px rgba(185, 28, 28, 0.15)',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                        e.currentTarget.style.background = 'rgba(185, 28, 28, 0.2)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(185, 28, 28, 0.3)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.background = 'rgba(185, 28, 28, 0.1)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(185, 28, 28, 0.15)';
                    }}>
                    <User size={28} />
                    <span>登录 / 注册</span>
                </NavLink>
            </div>
        );
    }

    return (
        <div ref={dropdownRef} style={{
            position: 'fixed',
            top: '2rem',
            right: '2.5rem',
            zIndex: 1000,
            animation: 'fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0.8rem 1.8rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '3rem',
                    color: '#f1f5f9',
                    fontSize: '24px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'none';
                }}
            >
                <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
                }}>
                    <User size={24} color="white" />
                </div>
                <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {username}
                </span>
                <ChevronDown size={24} style={{
                    transition: 'transform 0.3s',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    opacity: 0.5
                }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 1rem)',
                    right: 0,
                    width: '260px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '1.5rem',
                    padding: '1rem',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                    animation: 'fadeInUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <ShieldCheck size={20} color="#ef4444" />
                        <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>系统授权用户</span>
                    </div>

                    <button
                        onClick={logout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '1rem',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '0.75rem',
                            color: '#f87171',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={22} />
                        退出安全登录
                    </button>
                </div>
            )}
        </div>
    );
};
