import React, { useState, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FileOutput, Upload, Menu } from 'lucide-react';

const CONVERT_TASKS = [
    { value: 'pdf-to-word', label: 'PDF → Word', accept: '.pdf', multi: false },
    { value: 'pdf-to-excel', label: 'PDF → Excel', accept: '.pdf', multi: false },
    { value: 'img-to-pdf', label: '图片 → PDF', accept: 'image/*', multi: true },
];

export const Converter = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};
    const [task, setTask] = useState('pdf-to-word');
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('');
    const [isConverting, setIsConverting] = useState(false);

    const currentTask = CONVERT_TASKS.find(t => t.value === task);

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files || []));
        setStatus('');
    };

    const handleConvert = async () => {
        if (files.length === 0 || isConverting) return;
        setIsConverting(true);
        setStatus('正在转换...');

        const formData = new FormData();
        if (currentTask.multi) {
            files.forEach(f => formData.append('files', f));
        } else {
            formData.append('file', files[0]);
        }

        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            const response = await fetch(`/api/convert/${task}`, { method: 'POST', headers, body: formData });

            if (!response.ok) {
                let errText = await response.text();
                try { errText = JSON.parse(errText).detail || errText; } catch (e) { }
                throw new Error(errText || `HTTP Error ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const ext = task === 'pdf-to-word' ? '.docx' : task === 'pdf-to-excel' ? '.xlsx' : '.pdf';
            a.download = `converted_${Date.now()}${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            setStatus('✅ 文件已下载');
        } catch (e) {
            setStatus(`转换失败: ${e.message}`);
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <FileOutput size={32} /> 格式转换
                </h2>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>转换类型</label>
                        <select value={task} onChange={e => { setTask(e.target.value); setFiles([]); setStatus(''); }}
                            style={{ width: '100%', padding: '1.2rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', fontSize: '1.3rem' }}>
                            {CONVERT_TASKS.map(t => <option key={t.value} value={t.value} style={{ fontSize: '1.1rem' }}>{t.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            <Upload size={24} style={{ verticalAlign: 'text-bottom', marginRight: '8px' }} />
                            上传文件
                        </label>
                        <input type="file" accept={currentTask?.accept}
                            multiple={currentTask?.multi}
                            onChange={handleFileChange}
                            style={{ width: '100%', padding: '1.2rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', fontSize: '1.2rem' }}
                        />
                    </div>

                    <button onClick={handleConvert} disabled={isConverting || files.length === 0}
                        className="primary-btn"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1.2rem', fontSize: '1.4rem', opacity: (isConverting || files.length === 0) ? 0.6 : 1, cursor: (isConverting || files.length === 0) ? 'not-allowed' : 'pointer' }}
                    >
                        {isConverting ? '转换中...' : '开始转换'}
                    </button>

                    {status && (
                        <div style={{ padding: '1rem', background: '#1e1e1e', borderRadius: '0.5rem', border: '1px solid #333', lineHeight: '1.6' }}>
                            {status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
