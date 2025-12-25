import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { downloadPDF } from '../services/api';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalysisDashboard = ({ data, onCertify }) => {
    if (!data) return null;

    const { analysis, recommendations, report_hash_preview } = data;



    let qualityScore = 0;
    let issues = [];
    try {
        const qual = typeof analysis.quality_analysis === 'string'
            ? JSON.parse(analysis.quality_analysis)
            : analysis.quality_analysis;
        qualityScore = qual.score || 0;
        issues = qual.issues || [];
    } catch (e) {
        console.error("Error parsing quality data", e);
    }

    const chartData = {
        labels: ['Data Quality Score'],
        datasets: [
            {
                label: 'Score / 100',
                data: [qualityScore],
                backgroundColor: qualityScore > 80 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)',
            },
        ],
    };

    const handleDownload = async () => {
        try {
            const blob = await downloadPDF(data);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report_${data.filename}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            toast.error("Failed to download PDF");
        }
    };

    return (
        <div className="dashboard-container">
            <div className="glass-panel stats-panel">
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Analysis Results
                </h3>
                <div style={{ height: '200px' }}>
                    <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>

                <div className="issues-list" style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-secondary)' }}>Detected Issues</h4>
                    {issues.length > 0 ? (
                        <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-primary)' }}>
                            {issues.map((issue, idx) => <li key={idx} className="issue-item">{issue}</li>)}
                        </ul>
                    ) : <p style={{ color: 'var(--success-color)' }}>No major issues detected.</p>}
                </div>
            </div>

            <div className="glass-panel recommendations-panel">
                <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    AI Recommendations (Business Advisor)
                </h3>
                <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {recommendations.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}\u{3297}\u{3299}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F191}-\u{1F19A}\u{1F201}-\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}-\u{1F251}\u{1F700}-\u{1F7FF}]/gu, '')}
                    </ReactMarkdown>
                </div>
            </div>

            <div className="glass-panel action-panel">
                <h3 style={{ color: 'var(--text-primary)' }}>Actions</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Report Hash: <span className="hash-code" style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px', borderRadius: '4px', color: 'var(--primary-color)' }}>{report_hash_preview}</span></p>
                <div className="button-group" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button onClick={handleDownload} className="connect-btn">Download PDF Report</button>
                    {data.is_certified ? (
                        <button disabled className="primary-btn" style={{ background: 'var(--success-color)', cursor: 'default' }}>
                            Certified on Blockchain
                        </button>
                    ) : (
                        <button onClick={() => onCertify(data)} className="primary-btn">
                            Certify on Blockchain
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalysisDashboard;
