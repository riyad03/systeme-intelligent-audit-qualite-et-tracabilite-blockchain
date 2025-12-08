import React, { useState } from 'react';
import axios from 'axios';
import * as ethers from "ethers";
import ReportRegistryAbi from '../ReportRegistryAbi.json';

const CONTRACT_ADDRESS = "0xREPLACE_WITH_YOUR_CONTRACT_ADDRESS";

export default function UploadAndStore() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState(null);
  const [reportId, setReportId] = useState('');

  async function fileToSha256Hex(file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleUploadAndAnalyze(e) {
    e.preventDefault();
    if (!file) return alert('Choisis un fichier CSV ou XLSX');

    setStatus('Uploading file to backend...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('http://127.0.0.1:5000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { reportId: rid, pdfUrl } = res.data;
      setReportId(rid || 'generated-' + Date.now());
      setStatus('Backend finished. Downloading PDF to compute hash...');

      const pdfResp = await axios.get(pdfUrl, { responseType: 'blob' });
      const pdfBlob = pdfResp.data;

      setStatus('Computing SHA-256...');
      const hashHex = await fileToSha256Hex(pdfBlob);
      setStatus('Hash computed: ' + hashHex);

      await storeOnChain(rid || 'id-' + Date.now(), hashHex);
    } catch (err) {
      console.error(err);
      setStatus('Erreur: ' + (err.message || err));
    }
  }

  async function storeOnChain(id, hashHex) {
    if (!window.ethereum) return alert('Installe MetaMask');
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ReportRegistryAbi, signer);

      const dateSec = Math.floor(Date.now() / 1000);
      setStatus('⏳ Sending transaction to store report on chain...');

      const tx = await contract.storeReport(id, dateSec.toString(), hashHex);
      setTxHash(tx.hash);
      setStatus('Transaction sent: ' + tx.hash + ' — waiting confirmation...');

      await tx.wait();
      setStatus('✅ Transaction confirmed! Report stored on chain.');
    } catch (err) {
      console.error(err);
      setStatus('❌ Erreur blockchain: ' + (err.message || err));
    }
  }

  return (
    <div style={{
      backgroundColor: '#f9fafb',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
      maxWidth: '100%',
      width: '100%'
    }}>
      <form onSubmit={handleUploadAndAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={e => setFile(e.target.files[0])}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        />

        <button type="submit" style={{
          background: 'linear-gradient(90deg, #0d6efd, #6610f2)',
          color: 'white',
          padding: '12px',
          fontSize: '1rem',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Analyser & Stocker sur blockchain
        </button>
      </form>

      <div style={{ marginTop: '25px', fontSize: '0.95rem', color: '#333' }}>
        <p><b>Report ID:</b> {reportId || '-'}</p>
        <p><b>TxHash:</b> {txHash || '-'}</p>
        <p><b>Status:</b> {status}</p>
      </div>
    </div>
  );
}
