import React, { useState, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { PenTool, Play, FileDown, Menu, Copy, Check } from 'lucide-react';

const CREATIVE_OPTIONS = [
    {
        label: '职场办公', options: [
            { value: 'daily_report', label: '日报生成' }, { value: 'weekly_report', label: '周报生成' },
            { value: 'email', label: '商务邮件' }, { value: 'meeting_minutes', label: '会议纪要整理' },
            { value: 'excel_gen', label: 'Excel 生成' }, { value: 'okr_draft', label: 'OKR 起草' }
        ]
    },
    {
        label: '学术教育', options: [
            { value: 'translation', label: '翻译润色' }, { value: 'essay_outline', label: '论文/文章大纲' },
            { value: 'study_plan', label: '学习计划制定' }
        ]
    },
    {
        label: '新媒体运营', options: [
            { value: 'xhs_copy', label: '小红书文案' }, { value: 'video_script', label: '短视频脚本' }
        ]
    },
    {
        label: '生活助手', options: [
            { value: 'recipe_gen', label: '食材生成菜谱' }, { value: 'travel_plan', label: '旅行计划' }
        ]
    },
    {
        label: '职场进阶', options: [
            { value: 'resume_polish', label: '简历优化' }, { value: 'interview_prep', label: '面试模拟准备' }
        ]
    },
    {
        label: '商业分析', options: [
            { value: 'swot_analysis', label: 'SWOT 分析' }, { value: 'contract_review', label: '合同风险审查' }
        ]
    },
    {
        label: '写作辅助', options: [
            { value: 'title_gen', label: '爆款标题生成' }, { value: 'article_polish', label: '文章润色' }
        ]
    }
];

export const Creative = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};

    const [task, setTask] = useState('daily_report');
    const [fields, setFields] = useState({
        receiver: '', topic: '', content: '', target_lang: '', time: '', destination: '', days: ''
    });

    const [result, setResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            alert('复制失败');
        }
    };

    const handleFieldChange = (key, value) => {
        setFields(prev => ({ ...prev, [key]: value }));
    };

    const executeGeneration = async () => {
        setIsGenerating(true);
        setResult('AI 正在创作...');

        const provider = localStorage.getItem('llm_provider') || 'OpenRouter';
        const model = localStorage.getItem('llm_model') || '';
        const apiKey = localStorage.getItem('llm_key') || '';
        const baseUrl = localStorage.getItem('llm_base_url') || '';

        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/generate/creative', {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task,
                    fields,
                    provider,
                    model,
                    api_key: apiKey,
                    base_url: baseUrl || null
                })
            });

            const contentType = response.headers.get("content-type");

            // Handle Excel Download from JSON response
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || `HTTP Error ${response.status}`);
                }

                if (data.download_url) {
                    const fileRes = await fetch(data.download_url, { headers });
                    if (fileRes.ok) {
                        const blob = await fileRes.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `creative_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        setResult('Excel 文件已生成并下载。');
                    } else {
                        let errText = await fileRes.text();
                        try { errText = JSON.parse(errText).detail || errText; } catch (e) { }
                        setResult(`下载错误: ${errText}`);
                    }
                    return;
                } else if (data.detail) {
                    setResult(`错误: ${data.detail}`);
                    return;
                }
            }

            if (!response.ok) {
                let errText = await response.text();
                try { errText = JSON.parse(errText).detail || errText; } catch (e) { }
                throw new Error(errText || `HTTP Error ${response.status}`);
            }

            // Normal Text Streaming
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            setResult("");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value);
                setResult(fullText);
            }
        } catch (e) {
            setResult(`Error: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const renderDynamicForm = () => {
        const inputStyle = { width: '100%', marginBottom: '1rem', padding: '1.2rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', fontSize: '1.3rem' };
        const textareaStyle = { ...inputStyle, minHeight: '180px', resize: 'vertical', fontFamily: 'inherit' };

        switch (task) {
            case 'email':
                return (
                    <>
                        <input placeholder="收件人" style={inputStyle} value={fields.receiver} onChange={e => handleFieldChange('receiver', e.target.value)} />
                        <input placeholder="主题" style={inputStyle} value={fields.topic} onChange={e => handleFieldChange('topic', e.target.value)} />
                        <textarea placeholder="主要内容点..." style={textareaStyle} value={fields.content} onChange={e => handleFieldChange('content', e.target.value)} />
                    </>
                );
            case 'translation':
                return (
                    <>
                        <input placeholder="目标语言 (如 English, Japanese)" style={inputStyle} value={fields.target_lang} onChange={e => handleFieldChange('target_lang', e.target.value)} />
                        <textarea placeholder="需要翻译的内容..." style={textareaStyle} value={fields.content} onChange={e => handleFieldChange('content', e.target.value)} />
                    </>
                );
            case 'study_plan':
                return (
                    <>
                        <input placeholder="学习科目/技能 (如 Python, 钢琴)" style={inputStyle} value={fields.topic} onChange={e => handleFieldChange('topic', e.target.value)} />
                        <input placeholder="可用时间 (如 3个月, 每天2小时)" style={inputStyle} value={fields.time} onChange={e => handleFieldChange('time', e.target.value)} />
                    </>
                );
            case 'xhs_copy':
            case 'video_script':
                return (
                    <>
                        <input placeholder="主题/产品名称" style={inputStyle} value={fields.topic} onChange={e => handleFieldChange('topic', e.target.value)} />
                        <textarea placeholder="卖点/大概想法..." style={textareaStyle} value={fields.content} onChange={e => handleFieldChange('content', e.target.value)} />
                    </>
                );
            case 'travel_plan':
                return (
                    <>
                        <input placeholder="目的地 (如 杭州, 日本)" style={inputStyle} value={fields.destination} onChange={e => handleFieldChange('destination', e.target.value)} />
                        <input placeholder="旅行天数 (如 3天2晚)" style={inputStyle} value={fields.days} onChange={e => handleFieldChange('days', e.target.value)} />
                    </>
                );
            case 'excel_gen':
                return (
                    <>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>数据描述/需求</label>
                        <textarea placeholder="例如：生成一份2026年第一季度销售数据，包含月份、产品、销量、销售额..." style={textareaStyle} value={fields.content} onChange={e => handleFieldChange('content', e.target.value)} />
                    </>
                );
            default:
                let ph = "输入内容...";
                if (task === 'meeting_minutes') ph = "输入会议纪要草稿/速记...";
                if (task === 'okr_draft') ph = "输入你的年度/季度目标...";
                if (task === 'essay_outline') ph = "输入论文/文章主题...";
                if (task === 'recipe_gen') ph = "输入现有食材...";

                return (
                    <textarea placeholder={ph} style={{ ...textareaStyle, minHeight: '150px' }} value={fields.content} onChange={e => handleFieldChange('content', e.target.value)} />
                );
        }
    };

    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <PenTool size={32} /> 创作工坊
                </h2>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflowY: 'auto' }}>
                <div style={{ marginBottom: '2rem', maxWidth: '800px' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>选择创作类型</label>
                    <select
                        value={task}
                        onChange={(e) => { setTask(e.target.value); setFields({ receiver: '', topic: '', content: '', target_lang: '', time: '', destination: '', days: '' }); setResult(''); }}
                        style={{ width: '100%', padding: '1.2rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', fontSize: '1.3rem' }}
                    >
                        {CREATIVE_OPTIONS.map((group, idx) => (
                            <optgroup key={idx} label={group.label} style={{ fontSize: '1.2rem' }}>
                                {group.options.map(opt => (
                                    <option key={opt.value} value={opt.value} style={{ fontSize: '1.1rem' }}>{opt.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
                    {renderDynamicForm()}
                    <button
                        onClick={executeGeneration}
                        disabled={isGenerating}
                        className="primary-btn"
                        style={{
                            marginTop: '1rem',
                            padding: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.8rem',
                            fontSize: '1.4rem',
                            opacity: isGenerating ? 0.6 : 1,
                            cursor: isGenerating ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Play size={28} /> {isGenerating ? '生成中...' : '生成内容'}
                    </button>
                </div>

                {result && (
                    <div style={{
                        marginTop: '2rem',
                        background: '#1e1e1e',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        lineHeight: '1.6',
                        border: '1px solid #333',
                        position: 'relative'
                    }}>
                        <button
                            onClick={handleCopy}
                            style={{
                                position: 'absolute',
                                top: '0.8rem',
                                right: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '0.5rem 1rem',
                                background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
                                border: copied ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '0.5rem',
                                color: copied ? '#22c55e' : 'white',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {copied ? <><Check size={16} /> 已复制</> : <><Copy size={16} /> 复制</>}
                        </button>
                        {result}
                    </div>
                )}
            </div>
        </div>
    );
};
