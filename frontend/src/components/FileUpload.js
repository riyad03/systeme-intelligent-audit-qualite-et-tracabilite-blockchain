import React, { useState } from 'react';
import { uploadAndAnalyze } from '../services/api';

const FileUpload = ({ onAnalysisComplete }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await uploadAndAnalyze(file);
            onAnalysisComplete(result);
        } catch (err) {
            setError('Analysis failed. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: '3rem',
            marginTop: '2rem'
        }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Select Audit File</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Supported formats: .CSV, .XLSX</p>

            <div className="file-input-wrapper" style={{ marginBottom: '1.5rem' }}>
                <input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={handleFileChange}
                    id="file-upload"
                    className="file-input"
                    style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="primary-btn" style={{ background: '#fff', color: 'var(--primary-color)', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'inline-block' }}>
                    {file ? file.name : "Browse Files"}
                </label>
            </div>

            {error && <div className="error-message" style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}

            {file && (
                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="primary-btn"
                    style={{ width: '100%', maxWidth: '200px' }}
                >
                    {loading ? "Analyzing..." : "Start Analysis"}
                </button>
            )}
        </div>
    );
};

export default FileUpload;
