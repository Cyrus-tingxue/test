import React, { useState, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Table, Upload, Play, Download, Menu } from 'lucide-react';

export const ExcelAssistant = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};
    const [file, setFile] = useState(null);
    const [instruction, setInstruction] = useState('');
    const [result, setResult] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0] || null);
        setResult('');
        setDownloadUrl('');
    };

    const handleProcess = async () => {
        if (!file || !instruction.trim() || isProcessing) return;
        setIsProcessing(true);
        setResult('正在处理...');
        setDownloadUrl('');

        const provider = localStorage.getItem('llm_provider') || 'OpenRouter';
        const model = localStorage.getItem('llm_model') || '';
        const apiKey = localStorage.getItem('llm_key') || '';
        const baseUrl = localStorage.getItem('llm_base_url') || '';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('instruction', instruction);
        formData.append('provider', provider);
        formData.append('model', model);
        formData.append('api_key', apiKey);
        if (baseUrl) formData.append('base_url', baseUrl);

        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch('/api/code/excel/process', { method: 'POST', headers, body: formData });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value);
            }

            // The backend returns JSON with keepalive stream
            try {
                const data = JSON.parse(fullText);
                if (data.download_url) {
                    setDownloadUrl(data.download_url);
                    setResult('✅ Excel 处理完成！点击下方按钮下载结果。');
                } else if (data.detail) {
                    setResult(`错误: ${data.detail}`);
                } else {
                    setResult(JSON.stringify(data, null, 2));
                }
            } catch (e) {
                // Could be a plain text error or multipart
                setResult(fullText || '处理完成，但未返回有效数据。');
            }
        } catch (e) {
            setResult(`Error: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!downloadUrl) return;
        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        try {
            const res = await fetch(downloadUrl, { headers });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `processed_${Date.now()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (e) {
            setResult(`下载失败: ${e.message}`);
        }
    };

    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <Table size={32} /> Excel 助手
                </h2>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflowY: 'auto' }}>
                <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            <Upload size={24} style={{ verticalAlign: 'text-bottom', marginRight: '8px' }} />
                            上传 Excel 文件
                        </label>
                        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange}
                            style={{ width: '100%', padding: '1.2rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', fontSize: '1.2rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>处理指令</label>
                        <textarea
                            value={instruction} onChange={(e) => setInstruction(e.target.value)}
                            placeholder="例如: 将销售额列求和, 按日期分组统计, 筛选出大于100的行..."
                            style={{ width: '100%', minHeight: '180px', padding: '1.5rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', resize: 'vertical', fontFamily: 'inherit', fontSize: '1.2rem' }}
                        />
                    </div>

                    <button onClick={handleProcess} disabled={isProcessing || !file || !instruction.trim()}
                        className="primary-btn"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1.2rem', fontSize: '1.4rem', opacity: (isProcessing || !file || !instruction.trim()) ? 0.6 : 1, cursor: (isProcessing || !file || !instruction.trim()) ? 'not-allowed' : 'pointer' }}
                    >
                        <Play size={28} /> {isProcessing ? '处理中...' : '开始处理'}
                    </button>
                </div>

                {result && (
                    <div style={{ marginTop: '1.5rem', background: '#1e1e1e', padding: '1.5rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', border: '1px solid #333' }}>
                        {result}
                    </div>
                )}

                {downloadUrl && (
                    <button onClick={handleDownload} className="primary-btn"
                        style={{ marginTop: '1rem', background: '#22c55e', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}
                    >
                        <Download size={18} /> 下载处理结果
                    </button>
                )}
            </div>
        </div>
    );
};
