import React, { useState, useContext, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BrainCircuit, Play, Download, Menu, Code, RefreshCw } from 'lucide-react';
import mermaid from 'mermaid';

const CHART_TYPES = [
    { value: 'mindmap', label: '思维导图' },
    { value: 'flowchart', label: '流程图' },
    { value: 'timeline', label: '时间轴' },
    { value: 'gantt', label: '甘特图' },
    { value: 'sequence', label: '时序图' },
    { value: 'class', label: '类图' },
    { value: 'state', label: '状态图' },
    { value: 'pie', label: '饼图' },
];

export const MindMap = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};

    const [chartType, setChartType] = useState('mindmap');
    const [topic, setTopic] = useState('');
    const [status, setStatus] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [mermaidCode, setMermaidCode] = useState('');
    const [showCode, setShowCode] = useState(false);

    const renderRef = useRef(null);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
                primaryColor: '#ffffff',           // 白色节点背景
                primaryTextColor: '#000000',       // 黑色文字
                primaryBorderColor: '#333333',     // 深灰边框
                lineColor: '#888888',              // 灰色线条
                secondaryColor: '#f0f0f0',         // 次要背景（浅灰）
                tertiaryColor: '#e5e5e5',          // 三级背景
                fontSize: '24px',
                fontFamily: 'Inter, system-ui, sans-serif',
                nodeBorder: '2px',
                clusterBkg: 'rgba(255,255,255,0.1)',
                edgeLabelBackground: '#ffffff'
            },
            securityLevel: 'loose',
        });
    }, []);

    const renderChart = async (code) => {
        if (!code || !renderRef.current) return;
        renderRef.current.innerHTML = '<div class="loading-spinner"></div> 渲染中...';
        try {
            const id = 'mermaid-svg-' + Date.now();
            const { svg } = await mermaid.render(id, code);
            renderRef.current.innerHTML = svg;

            const svgElement = renderRef.current.querySelector('svg');
            if (svgElement) {
                // 让 SVG 自然撑开，不限制尺寸
                svgElement.removeAttribute('width');
                svgElement.removeAttribute('height');
                svgElement.style.width = '100%';
                svgElement.style.height = 'auto';
                svgElement.style.minHeight = '400px';
                svgElement.style.display = 'block';

                // 注入全局对比度修正（针对某些 node 样式）
                const styles = document.createElement('style');
                styles.innerHTML = `
                    text { fill: #000000 !important; font-weight: 700 !important; }
                    .node text, .label text, .nodeLabel, .label, span { fill: #000000 !important; color: #000000 !important; font-weight: 700 !important; }
                    foreignObject div, foreignObject span, foreignObject p { color: #000000 !important; font-weight: 700 !important; }
                    .node rect, .node polygon, .node circle, .node ellipse { fill: #ffffff !important; stroke: #333333 !important; stroke-width: 2px !important; }
                    .mindmap-node rect, .mindmap-node circle, .mindmap-node polygon { fill: #ffffff !important; stroke: #333333 !important; stroke-width: 2px !important; }
                    section { fill: #ffffff !important; color: #000000 !important; }
                    .edgePath path { stroke: #888888 !important; stroke-width: 2.5px !important; }
                `;
                svgElement.appendChild(styles);
            }
        } catch (err) {
            console.error("Mermaid Render Error:", err);
            renderRef.current.innerHTML = `<div style="color: #fca5a5; padding: 1rem; border: 1px dashed #fca5a5; border-radius: 0.5rem;">渲染失败：${err.message || '请检查语法'}</div>`;
        }
    };

    const handleGenerate = async () => {
        if (!topic.trim() || isGenerating) return;
        setIsGenerating(true);
        setStatus('正在通过 AI 生成架构...');
        setMermaidCode('');

        if (renderRef.current) renderRef.current.innerHTML = '';

        const provider = localStorage.getItem('llm_provider') || 'OpenRouter';
        const model = localStorage.getItem('llm_model') || '';
        const apiKey = localStorage.getItem('llm_key') || '';
        const baseUrl = localStorage.getItem('llm_base_url') || '';

        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/generate/mindmap', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    topic,
                    chart_type: chartType,
                    provider,
                    model,
                    api_key: apiKey,
                    base_url: baseUrl || null
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || '生成失败');
            }

            // Backend returns a JSON stream with "code"
            // But wait, the backend StreamingResponse sometimes needs keepalive handling
            // Let's assume it returns one JSON object at the end or use the reader.
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value);
            }

            try {
                const data = JSON.parse(fullText);
                if (data.code) {
                    setMermaidCode(data.code);
                    renderChart(data.code);
                    setStatus('生成成功');
                } else {
                    throw new Error('未返回有效的 Mermaid 代码');
                }
            } catch (e) {
                setMermaidCode(fullText); // Fallback if not pure JSON
                renderChart(fullText);
            }
        } catch (e) {
            setStatus(`错误: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (format) => {
        const svg = renderRef.current.querySelector('svg');
        if (!svg) return;

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        if (format === 'svg') {
            const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chart_${Date.now()}.svg`;
            a.click();
        } else {
            // PNG or JPG
            const image = new Image();
            image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const bbox = svg.getBBox ? svg.getBBox() : { width: 1200, height: 800 };
                const scale = 2;
                canvas.width = (svg.viewBox.baseVal.width || bbox.width) * scale;
                canvas.height = (svg.viewBox.baseVal.height || bbox.height) * scale;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.scale(scale, scale);
                ctx.drawImage(image, 0, 0);
                const a = document.createElement('a');
                if (format === 'jpg') {
                    a.href = canvas.toDataURL('image/jpeg', 0.95);
                    a.download = `chart_${Date.now()}.jpg`;
                } else {
                    a.href = canvas.toDataURL('image/png');
                    a.download = `chart_${Date.now()}.png`;
                }
                a.click();
            };
        }
    };

    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <BrainCircuit size={32} /> 思维导图 & 图表
                </h2>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <select value={chartType} onChange={e => setChartType(e.target.value)}
                        style={{ padding: '1.2rem 1.5rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', width: '160px', fontSize: '1.3rem' }}>
                        {CHART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                        placeholder="输入主题，例如：Python 学习路线"
                        style={{ flex: 1, minWidth: '200px', padding: '1.2rem 1.5rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', fontSize: '1.3rem' }} />
                    <button onClick={handleGenerate} disabled={isGenerating || !topic.trim()}
                        className="primary-btn" style={{ width: 'auto', padding: '1rem 2.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: (isGenerating || !topic.trim()) ? 0.6 : 1, borderRadius: '0.8rem', fontSize: '1.3rem' }}>
                        <Play size={28} /> {isGenerating ? '生成中...' : '生成'}
                    </button>
                </div>

                {status && <div style={{ marginBottom: '1rem', fontSize: '1.4rem', color: status.includes('错误') ? '#ef4444' : '#a5b4fc', fontWeight: '500' }}>{status}</div>}

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    <div style={{ padding: '0.8rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', background: 'rgba(0,0,0,0.2)' }}>
                        <button onClick={() => setShowCode(!showCode)} style={{ padding: '0.6rem 1.2rem', fontSize: '1.1rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginRight: 'auto' }}>
                            <Code size={20} /> {showCode ? '隐藏源码' : '查看源码'}
                        </button>
                        <button onClick={() => handleDownload('svg')} style={{ padding: '0.6rem 1.2rem', fontSize: '1.1rem', background: 'transparent', color: 'white', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={20} /> SVG</button>
                        <button onClick={() => handleDownload('png')} style={{ padding: '0.6rem 1.2rem', fontSize: '1.1rem', background: 'transparent', color: 'white', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={20} /> PNG</button>
                        <button onClick={() => handleDownload('jpg')} style={{ padding: '0.6rem 1.2rem', fontSize: '1.1rem', background: 'transparent', color: 'white', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={20} /> JPG</button>
                        {mermaidCode && (
                            <button onClick={() => renderChart(mermaidCode)} style={{ padding: '0.6rem 1.2rem', fontSize: '1.1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <RefreshCw size={20} /> 刷新
                            </button>
                        )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {showCode && (
                            <textarea value={mermaidCode} onChange={e => setMermaidCode(e.target.value)}
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, height: '200px', background: '#1e1e1e', color: '#a5b4fc', border: 'none', borderBottom: '1px solid var(--border)', padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem' }}
                            />
                        )}
                        <div style={{ flex: 1, padding: '1.5rem', overflow: 'auto', display: 'flex' }}>
                            {/* Inner wrapper to handle scrolling properly without shrinking svg */}
                            <div ref={renderRef} style={{ minWidth: 'max-content', minHeight: 'max-content', margin: 'auto' }}>
                                {/* Mermaid Render Target */}
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '4rem' }}>
                                    请在上方输入主题并点击生成
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
