import React, { useState, useContext, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BarChart2, Upload, Play, Download, Menu, Plus, X } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export const Viz = () => {
    const { authToken } = useContext(AuthContext);
    const { toggleSidebar } = useOutletContext() || {};
    const [file, setFile] = useState(null);
    const [data, setData] = useState(null);
    const [status, setStatus] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const [chartType, setChartType] = useState('bar');
    const [xAxis, setXAxis] = useState('');
    const [yAxes, setYAxes] = useState(['']);
    const [showChart, setShowChart] = useState(false);

    const chartRef = useRef(null);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setData(null);
        setShowChart(false);
        setStatus('正在解析数据...');
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        try {
            // Note: In main.js it was /api/analyze/table, but we know it's in convert router
            // Actually, looking at main.js, it might be /api/convert/table/analyze if we follow the prefix
            // Let's check api_server.py prefix again.
            // Line 86: app.include_router(convert.router, prefix="/api/convert")
            // routes/convert.py: @router.post("/table/analyze")
            // So /api/convert/table/analyze is correct.
            const response = await fetch('/api/convert/table/analyze', {
                method: 'POST',
                headers: headers,
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || '解析失败');
            }

            const res = await response.json();
            setData(res);
            setStatus(`已加载 ${res.total_rows} 行数据`);
            if (res.columns.length > 0) setXAxis(res.columns[0]);
            if (res.numeric_columns.length > 0) setYAxes([res.numeric_columns[0]]);
        } catch (e) {
            setStatus(`错误: ${e.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const addYAxis = () => {
        if (data?.numeric_columns?.length > 0) {
            setYAxes([...yAxes, data.numeric_columns[0]]);
        }
    };

    const removeYAxis = (index) => {
        const newY = [...yAxes];
        newY.splice(index, 1);
        setYAxes(newY);
    };

    const handleYChange = (index, value) => {
        const newY = [...yAxes];
        newY[index] = value;
        setYAxes(newY);
    };

    const getChartData = () => {
        if (!data) return { labels: [], datasets: [] };

        const labels = data.data.map(row => row[xAxis]);
        const colors = [
            'rgba(99, 102, 241, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(234, 179, 8, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(236, 72, 153, 0.7)',
        ];

        const datasets = yAxes.map((yCol, idx) => ({
            label: yCol,
            data: data.data.map(row => row[yCol]),
            backgroundColor: colors[idx % colors.length],
            borderColor: colors[idx % colors.length].replace('0.7', '1'),
            borderWidth: 1,
        }));

        return { labels, datasets };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#e5e7eb' }
            },
            title: {
                display: false,
            },
        },
        scales: chartType !== 'pie' ? {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#9ca3af' }
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#9ca3af' }
            }
        } : {},
    };

    const downloadImage = (format) => {
        const chart = chartRef.current;
        if (!chart) return;

        const link = document.createElement('a');

        if (format === 'svg') {
            // Chart.js is canvas based, so we wrap the canvas image in an SVG tag
            const width = chart.width;
            const height = chart.height;
            const imageData = chart.toBase64Image();
            const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <image width="100%" height="100%" href="${imageData}" />
            </svg>`;
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `chart-${Date.now()}.svg`;
            link.click();
            URL.revokeObjectURL(url);
        } else {
            link.download = `chart-${Date.now()}.${format}`;
            link.href = chart.toBase64Image(format === 'jpg' ? 'image/jpeg' : `image/${format}`);
            link.click();
        }
    };

    return (
        <div style={{ padding: '0 1rem 1rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header id="page-header" style={{ marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                <button id="menu-toggle" onClick={toggleSidebar} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', padding: '0.5rem', display: 'flex', marginRight: '1rem' }}>
                    <Menu size={32} />
                </button>
                <h2 id="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '2rem' }}>
                    <BarChart2 size={32} /> 数据可视化
                </h2>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ maxWidth: '800px', marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        <Upload size={24} style={{ verticalAlign: 'text-bottom', marginRight: '8px' }} />
                        上传数据文件 (CSV/Excel)
                    </label>
                    <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange}
                        style={{ width: '100%', padding: '1.2rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.8rem', fontSize: '1.2rem' }} />
                    {status && <p style={{ marginTop: '0.8rem', fontSize: '1.2rem', color: status.startsWith('错误') ? '#ef4444' : '#a5b4fc' }}>{status}</p>}
                </div>

                {data && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="responsive-grid-2col" style={{ maxWidth: '800px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>图表类型</label>
                                <select value={chartType} onChange={(e) => setChartType(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.5rem' }}>
                                    <option value="bar">柱状图</option>
                                    <option value="line">折线图</option>
                                    <option value="pie">饼图</option>
                                    <option value="scatter">散点图</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>X 轴 (类别)</label>
                                <select value={xAxis} onChange={(e) => setXAxis(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.5rem' }}>
                                    {data.columns.map(col => <option key={col} value={col}>{col}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ maxWidth: '800px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Y 轴 (数值序列)</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {yAxes.map((y, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                                        <select value={y} onChange={(e) => handleYChange(idx, e.target.value)}
                                            style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-darker)', border: '1px solid var(--border)', color: 'white', borderRadius: '0.5rem' }}>
                                            {data.numeric_columns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                        {idx === 0 ? (
                                            <button onClick={addYAxis} className="primary-btn" style={{ width: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></button>
                                        ) : (
                                            <button onClick={() => removeYAxis(idx)} className="primary-btn" style={{ width: '42px', padding: 0, background: '#374151', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => setShowChart(true)} className="primary-btn" style={{ maxWidth: '200px' }}>
                            <Play size={18} style={{ marginRight: '4px' }} /> 生成图表
                        </button>
                    </div>
                )}

                {showChart && (
                    <div style={{ marginTop: '2rem', flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginBottom: '1rem' }}>
                            <button onClick={() => downloadImage('png')} style={{ fontSize: '1.1rem', padding: '0.6rem 1.2rem', background: 'var(--bg-darker)', color: 'white', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={20} /> PNG</button>
                            <button onClick={() => downloadImage('jpg')} style={{ fontSize: '1.1rem', padding: '0.6rem 1.2rem', background: 'var(--bg-darker)', color: 'white', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={20} /> JPG</button>
                            <button onClick={() => downloadImage('svg')} style={{ fontSize: '1.1rem', padding: '0.6rem 1.2rem', background: 'var(--bg-darker)', color: 'white', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={20} /> SVG</button>
                        </div>
                        <div style={{ flex: 1, background: '#111', borderRadius: '0.5rem', border: '1px solid var(--border)', padding: '1rem', position: 'relative' }}>
                            {chartType === 'bar' && <Bar ref={chartRef} data={getChartData()} options={chartOptions} />}
                            {chartType === 'line' && <Line ref={chartRef} data={getChartData()} options={chartOptions} />}
                            {chartType === 'pie' && <Pie ref={chartRef} data={getChartData()} options={chartOptions} />}
                            {chartType === 'scatter' && <Scatter ref={chartRef} data={getChartData()} options={chartOptions} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
