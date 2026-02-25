import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../index.css';

export const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [username, setUsernameInput] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useContext(AuthContext);
    const navigate = useNavigate();

    // 登录页在 Layout 外，需要临时解除 body 的 overflow: hidden 以支持手机端滚动
    useEffect(() => {
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        return () => {
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100dvh';
        };
    }, []);

    const handleAuthSubmit = async () => {
        if (!username.trim() || !password.trim()) {
            return setErrorMsg('用户名和密码不能为空');
        }

        setLoading(true);
        setErrorMsg('');

        try {
            if (isLoginMode) {
                await login(username.trim(), password.trim());
            } else {
                await register(username.trim(), password.trim());
            }
            navigate('/'); // Redirect to Home
        } catch (e) {
            setErrorMsg(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            minHeight: '100vh', minHeight: '100dvh', backgroundColor: 'var(--bg-dark)', margin: 0,
            fontFamily: "'Inter', system-ui, sans-serif", overflowY: 'auto', position: 'relative',
            padding: '2rem 1rem', boxSizing: 'border-box'
        }}>
            <div className="bg-glow" style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 50%, rgba(185,28,28,0.1) 0%, rgba(0,0,0,0) 70%)', top: 0, left: 0, zIndex: 0 }}></div>
            <div className="auth-container" style={{
                background: 'rgba(17, 17, 17, 0.7)', backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '1.5rem',
                padding: '1.5rem', width: '100%', maxWidth: '450px',
                boxShadow: '0 40px 100px rgba(0, 0, 0, 0.8)', position: 'relative', zIndex: 1,
                animation: 'fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
                marginTop: '2vh'
            }}>
                <div className="auth-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'center', color: 'var(--primary)', filter: 'drop-shadow(0 0 15px rgba(185,28,28,0.4))' }}>
                        <ShieldCheck size={48} />
                    </div>
                    <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', color: 'white' }}>
                        {isLoginMode ? '安全登录' : '开始注册'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem', fontWeight: '500' }}>Office AI Mate Pro</p>
                </div>

                {errorMsg && (
                    <div className="error-msg" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {errorMsg}
                    </div>
                )}

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '600' }}>用户名</label>
                    <input
                        type="text"
                        placeholder="英文/数字"
                        value={username}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && document.getElementById('pass').focus()}
                        style={{ width: '100%', padding: '0.9rem 1.2rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', color: 'white', fontSize: '1.2rem', transition: 'all 0.3s ease', boxSizing: 'border-box', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                    />
                </div>
                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '600' }}>安全密码</label>
                    <input
                        id="pass"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuthSubmit()}
                        style={{ width: '100%', padding: '0.9rem 1.2rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.75rem', color: 'white', fontSize: '1.2rem', transition: 'all 0.3s ease', boxSizing: 'border-box', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                    />
                </div>

                <button
                    onClick={handleAuthSubmit}
                    className="primary-btn"
                    disabled={loading}
                    style={{ width: '100%', padding: '1rem', fontSize: '1.3rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', fontWeight: 'bold' }}
                >
                    {loading && <Loader2 className="animate-spin" size={24} />}
                    {loading ? '验证中...' : (isLoginMode ? '立即登录' : '创建账号')}
                </button>

                <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        {isLoginMode ? '没有通行证？' : '已有授权？'}
                    </span>
                    <a style={{ color: '#ef4444', textDecoration: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s', marginLeft: '10px', fontSize: '1.1rem' }}
                        onClick={() => setIsLoginMode(!isLoginMode)}
                    >
                        {isLoginMode ? '点击注册' : '点击登录'}
                    </a>
                </div>
            </div>
        </div>
    );
};
