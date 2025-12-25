import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import AnalysisDashboard from './components/AnalysisDashboard';
import { ethers } from 'ethers';
import AuditTraceability from './contracts/AuditTraceability.json';
import './index.css';
import { Toaster, toast } from 'react-hot-toast';
import Sidebar from './components/Sidebar';

const CONTRACT_ADDRESS = "0x8faA10E0Be86A7334E8D84C1e5d1E11Dc6B67D8F";

function App() {
    const [analysisData, setAnalysisData] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [networkName, setNetworkName] = useState('');
    const [view, setView] = useState('upload');



    const [isMainnet, setIsMainnet] = useState(false);

    // History State
    const [reportHistory, setReportHistory] = useState([]);

    useEffect(() => {
        if (view === 'reports') {
            fetch('http://localhost:8000/reports')
                .then(res => res.json())
                .then(data => setReportHistory(data))
                .catch(err => console.error("Failed to fetch history", err));
        }
    }, [view]);

    useEffect(() => {
        const detect = async () => {
            if (window.ethereum) {
                try {
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    setIsMainnet(chainId === '0x1');

                    const idStr = parseInt(chainId, 16).toString();
                    setNetworkName(idStr === "5777" ? "Ganache (5777)" : (idStr === "1337" ? "Ganache (1337)" : `ID: ${idStr}`));
                } catch (e) { console.error(e); }
            }
        };
        detect();
        if (window.ethereum) window.ethereum.on('chainChanged', (cId) => {
            if (cId === '0x1') setIsMainnet(true);
            else window.location.reload();
        });
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) return toast.error("Please install MetaMask");
        try {
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

            // 0x1 is Mainnet. 0x539 is 1337. 0x1691 is 5777.
            if (currentChainId === '0x1') {
                setIsMainnet(true);
                // Try forcing switch immediately
                await trySwitch();
                return;
            } else {
                setIsMainnet(false);
            }

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);

            // Standard loading logic...
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();
            const chainIdStr = network.chainId.toString();
            setNetworkName(chainIdStr === "5777" ? "Ganache (5777)" : `ID: ${chainIdStr}`);

            // Address logic fallback
            const deployedNetwork = AuditTraceability.networks[chainIdStr];
            let address = deployedNetwork ? deployedNetwork.address : null;
            if (!address && (chainIdStr === "5777" || chainIdStr === "1337")) address = CONTRACT_ADDRESS;

            if (address) {
                // Sanitize address
                const cleanAddr = address.trim().toLowerCase();

                // Simple validation: Must be 42 chars and start with 0x
                if (cleanAddr.length !== 42 || !cleanAddr.startsWith('0x')) {
                    toast.error(`Invalid Contract Address! Length: ${cleanAddr.length}`);
                    return;
                }

                try {
                    // Directly verify checksum
                    const checksumAddr = ethers.getAddress(cleanAddr);

                    const instance = new ethers.Contract(checksumAddr, AuditTraceability.abi, signer);
                    setContract(instance);
                    console.log("Contract loaded successfully at:", checksumAddr);
                } catch (contractError) {
                    console.error("Contract Init Error:", contractError);
                    toast.error(`Contract creation failed: ${contractError.message}`);
                }
            } else {
                // If wrong network but not Mainnet
                toast.error(`Contract address not found for Network ID ${chainIdStr}`);
            }

        } catch (e) { console.error(e); }
    };

    // Helper to add a network
    const addNetwork = async (chainId, name) => {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: chainId,
                chainName: name,
                rpcUrls: ['http://127.0.0.1:7545'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: null
            }]
        });
    };

    const trySwitch = async () => {
        const chain5777 = '0x1691';
        const chain1337 = '0x539';

        const upgradeTo = async (targetChain, name) => {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: targetChain }],
                });
                return true;
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    try {
                        await addNetwork(targetChain, name);
                        return true;
                    } catch (addError) {
                        console.warn(`Failed to add ${name}:`, addError);
                        return false;
                    }
                }
                console.warn(`Failed to switch to ${name}:`, switchError);
                return false;
            }
        };

        // Strategy: Try 5777 -> Fail? -> Try 1337 -> Fail? -> Alert
        let success = await upgradeTo(chain5777, 'Ganache (5777)');
        if (!success) {
            console.log("Retrying with Chain ID 1337...");
            success = await upgradeTo(chain1337, 'Ganache (1337)');
        }

        if (success) {
            setIsMainnet(false);
            window.location.reload(); // Refresh to ensure state is clean
        } else {
            toast.error("Automatic setup failed. Please manually select Ganache 7545.");
        }
    }

    if (isMainnet) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
                <h1>WRONG NETWORK DETECTED</h1>
                <h2>You are connected to Ethereum Mainnet!</h2>
                <p style={{ color: 'white', maxWidth: '500px', textAlign: 'center' }}>You must switch to your local Ganache network (ID 5777) to use this application.</p>
                <button
                    onClick={trySwitch}
                    style={{ padding: '20px 40px', fontSize: '20px', background: 'red', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' }}
                >
                    CLICK HERE TO SWITCH
                </button>
            </div>
        )
    }

    const handleAnalysisComplete = (data) => {
        setAnalysisData(data);
        setView('dashboard');
    };

    const handleCertify = async (data) => {
        if (!contract) {
            toast.error("Blockchain not connected. Check MetaMask.");
            return;
        }

        try {
            const dateStr = data.timestamp || new Date().toISOString();
            const hash = data.report_hash_preview;

            console.log("Certifying report with hash:", hash);


            const tx = await contract.certifyReport(dateStr, hash);
            await tx.wait();

            // Sync with Backend (Persistence)
            if (data.id) {
                await fetch(`http://localhost:8000/reports/${data.id}/certify`, { method: 'POST' });

                // Update Local Dashboard State
                setAnalysisData(prev => ({ ...prev, is_certified: true }));

                // Update History List State (if it exists)
                setReportHistory(prev => prev.map(r => r.id === data.id ? { ...r, is_certified: true } : r));
            }

            toast.success(`Report Certified! Hash: ${tx.hash.substring(0, 10)}...`);
        } catch (err) {
            console.error("Certification failed", err);

            // Handle MetaMask "User Rejected" error specifically
            if (err.code === 4001 || (err.info && err.info.error && err.info.error.code === 4001)) {
                toast.error("Transaction cancelled by user.");
                return;
            }

            // General error
            toast.error("Certification failed: " + (err.reason || err.message));
        }
    };


    const loadReport = async (id) => {
        try {
            const toastId = toast.loading("Loading report...");
            const res = await fetch(`http://localhost:8000/reports/${id}`);
            const data = await res.json();

            // Reconstruct the analysis info object expected by Dashboard
            const loadedData = {
                ...data,
                analysis: data.analysis,
                recommendations: data.recommendations,
                report_hash_preview: data.report_hash_preview || data.report_hash, // Handle legacy naming
                is_certified: data.is_certified
            };

            setAnalysisData(loadedData);
            setView('dashboard');
            toast.dismiss(toastId);
        } catch (e) {
            toast.error("Failed to load report");
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent loading report when clicking delete
        if (!window.confirm("Are you sure you want to delete this report? This Action cannot be undone from your local storage.")) return;

        try {
            const res = await fetch(`http://localhost:8000/reports/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setReportHistory(prev => prev.filter(r => r.id !== id));
                toast.success("Report deleted from local storage");
            } else {
                toast.error("Failed to delete report");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error deleting report");
        }
    };

    return (
        <div className="app-layout">
            <Toaster position="top-right" toastOptions={{
                style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0' }
            }} />

            <Sidebar activeView={view} setView={setView} />

            <main className="main-content">
                <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                    {account ? (
                        <div className="status-badge" style={{ background: '#fff', border: '1px solid var(--border-color)', gap: '12px' }}>
                            <span style={{ color: networkName.includes('5777') ? 'var(--success-color)' : 'var(--warning-color)', fontWeight: 600 }}>
                                {networkName}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>
                                {account.substring(0, 6)}...{account.substring(38)}
                            </span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {networkName && !networkName.includes("5777") && (
                                <button className="connect-btn" onClick={connectWallet}>
                                    Switch Network
                                </button>
                            )}
                            <button className="primary-btn" onClick={connectWallet}>
                                Connect Wallet
                            </button>
                        </div>
                    )}
                </header>

                {view === 'upload' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem 2rem', background: '#fff' }}>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                                Enterprise Audit Platform
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                                Secure, blockchain-verified financial analysis for modern enterprises.
                            </p>
                            <FileUpload onAnalysisComplete={handleAnalysisComplete} />
                        </div>
                    </div>
                )}

                {view === 'dashboard' && (
                    <AnalysisDashboard
                        data={analysisData}
                        onCertify={handleCertify}
                    />
                )}

                {view === 'reports' && (
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Audit History</h2>
                        </div>

                        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Report Name</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                No reports found. Start a new audit to generate history.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportHistory.map(report => (
                                            <tr key={report.id} onClick={() => loadReport(report.id)} style={{ cursor: 'pointer' }}>
                                                <td>{new Date(report.timestamp).toLocaleDateString()}</td>
                                                <td style={{ fontWeight: 500 }}>{report.filename}</td>
                                                <td>
                                                    <span style={{
                                                        color: report.quality_score > 80 ? 'var(--success-color)' : 'var(--warning-color)',
                                                        fontWeight: '700'
                                                    }}>
                                                        {report.quality_score}/100
                                                    </span>
                                                </td>
                                                <td>
                                                    {report.is_certified ? (
                                                        <span className="status-badge" style={{ background: '#ecfdf5', color: 'var(--success-color)', fontSize: '0.75rem' }}>Certified</span>
                                                    ) : (
                                                        <span className="status-badge" style={{ background: '#fffbeb', color: 'var(--warning-color)', fontSize: '0.75rem' }}>Pending</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        onClick={(e) => handleDelete(e, report.id)}
                                                        className="connect-btn"
                                                        style={{
                                                            color: 'var(--danger-color)',
                                                            borderColor: 'transparent',
                                                            padding: '6px 10px'
                                                        }}
                                                        title="Delete Report"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}


export default App;
