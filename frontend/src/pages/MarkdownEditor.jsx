import React, { useState, useContext, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Menu, Eye, Edit2 } from 'lucide-react';
import { marked } from 'marked';

export const MarkdownEditor = () => {
    const { toggleSidebar } = useOutletContext() || {};
    const [content, setContent] = useState('# Hello Markdown\n\n在此开始您的创作...');
    const [html, setHtml] = useState('');

    useEffect(() => {
        setHtml(marked.parse(content));
    }, [content]);

    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <FileText size={32} /> Markdown 编辑器
                </h2>
            </header>

            <div style={{ flex: 1, display: 'flex', gap: '1rem', overflow: 'hidden' }}>
                {/* Editor */}
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
                    <div style={{ padding: '0.8rem 1.2rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
                        <Edit2 size={24} /> 编辑模式
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={{ flex: 1, width: '100%', padding: '1.5rem', background: 'transparent', border: 'none', color: '#e5e7eb', fontSize: '1.25rem', lineHeight: '1.6', outline: 'none', resize: 'none', fontFamily: '"Fira Code", "Source Code Pro", monospace' }}
                    />
                </div>

                {/* Preview */}
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
                    <div style={{ padding: '0.8rem 1.2rem', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
                        <Eye size={24} /> 实时预览
                    </div>
                    <div
                        className="markdown-body"
                        dangerouslySetInnerHTML={{ __html: html }}
                        style={{ flex: 1, width: '100%', padding: '2rem', overflowY: 'auto', background: 'var(--bg-card)', color: '#e5e7eb', lineHeight: '1.8', fontSize: '1.2rem' }}
                    />
                </div>
            </div>

            <style>{`
        .markdown-body h1 { border-bottom: 1px solid #334155; padding-bottom: 0.3em; margin-bottom: 1rem; }
        .markdown-body h2 { border-bottom: 1px solid #334155; padding-bottom: 0.3em; margin-top: 1.5rem; }
        .markdown-body ul, .markdown-body ol { padding-left: 2em; margin-bottom: 1rem; }
        .markdown-body code { background: rgba(255,255,255,0.1); padding: 0.2rem 0.4rem; border-radius: 0.3rem; }
        .markdown-body pre { background: #111; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1rem; }
        .markdown-body blockquote { border-left: 4px solid #4f46e5; padding-left: 1rem; color: #94a3b8; margin: 1rem 0; }
        .markdown-body table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
        .markdown-body th, .markdown-body td { border: 1px solid #334155; padding: 0.5rem; }
        .markdown-body th { background: rgba(255,255,255,0.05); }
      `}</style>
        </div>
    );
};
