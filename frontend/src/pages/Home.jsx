import { useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, Sparkles, Zap, BrainCircuit, Rocket, Cpu } from 'lucide-react';

export const Home = () => {
    const { username } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};

    return (
        <>
            <style>
                {`
                .hero-container {
                    position: relative;
                    height: 70vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border-radius: 1.5rem;
                    background: radial-gradient(circle at 50% 50%, rgba(30, 0, 0, 0.5) 0%, transparent 70%);
                }

                .glowing-orb {
                    position: absolute;
                    width: 40vw;
                    height: 40vw;
                    max-width: 500px;
                    max-height: 500px;
                    background: radial-gradient(circle, rgba(185,28,28,0.15) 0%, rgba(10,10,10,0) 70%);
                    border-radius: 50%;
                    animation: pulseOrb 6s ease-in-out infinite alternate;
                    z-index: 0;
                    filter: blur(40px);
                }

                @keyframes pulseOrb {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(1.2); opacity: 1; }
                }

                .hero-content {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                }

                .animated-title {
                    font-size: clamp(3rem, 8vw, 6rem);
                    font-weight: 900;
                    letter-spacing: 0.05em;
                    background: linear-gradient(90deg, #ff4b4b, #ff9090, #ffffff, #ff4b4b);
                    background-size: 200% auto;
                    color: transparent;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation: shine 4s linear infinite;
                    margin-bottom: 1.5rem;
                    filter: drop-shadow(0 0 15px rgba(255, 75, 75, 0.4));
                }

                @keyframes shine {
                    to { background-position: 200% center; }
                }

                .animated-subtitle {
                    font-size: clamp(1.2rem, 3vw, 2rem);
                    color: var(--text-main);
                    opacity: 0;
                    animation: slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s forwards;
                    text-shadow: 0 0 20px rgba(255,255,255,0.2);
                    letter-spacing: 0.1em;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .floating-icon {
                    position: absolute;
                    color: rgba(255, 75, 75, 0.6);
                    animation: float 6s ease-in-out infinite;
                    filter: drop-shadow(0 0 10px rgba(255,75,75,0.4));
                    z-index: 5;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-25px) rotate(15deg); }
                }

                .delay-1 { animation-delay: 1.5s; }
                .delay-2 { animation-delay: 3s; }
                .delay-3 { animation-delay: 4.5s; }
                `}
            </style>
            <header id="page-header">
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title">首页</h2>
                <p id="page-desc">欢迎使用, {username || '探索者'}</p>
            </header>
            <div id="content-area" style={{ padding: '2rem' }}>
                <div className="hero-container">
                    <div className="glowing-orb"></div>

                    <Zap size={64} className="floating-icon delay-1" style={{ top: '15%', left: '20%' }} />
                    <BrainCircuit size={56} className="floating-icon delay-2" style={{ top: '25%', right: '20%' }} />
                    <Rocket size={72} className="floating-icon delay-3" style={{ bottom: '15%', left: '25%' }} />
                    <Cpu size={48} className="floating-icon" style={{ bottom: '25%', right: '25%' }} />

                    <div className="hero-content">
                        <div style={{ display: 'inline-block', marginBottom: '2rem', animation: 'float 4s ease-in-out infinite' }}>
                            <Sparkles size={80} color="#ff4b4b" style={{ filter: 'drop-shadow(0 0 20px rgba(255,75,75,0.8))' }} />
                        </div>
                        <h1 className="animated-title">A I &nbsp;M A T E</h1>
                        <p className="animated-subtitle">Made by Cyrus</p>
                    </div>
                </div>
            </div>
        </>
    );
};
