import React from 'react';
import UploadAndStore from './components/UploadAndStore';
import './App.css'; // On pourra mettre des styles globaux ici

function App() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        background: 'linear-gradient(90deg, #0d6efd, #6610f2)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600, letterSpacing: '0.5px' }}>
          Système d'audit & Traçabilité Blockchain
        </h1>
      </header>

      {/* Main */}
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '60px 20px' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          maxWidth: '720px',
          width: '100%',
          transition: 'transform 0.3s, box-shadow 0.3s'
        }}
        className="card-hover">
          <h2 style={{ textAlign: 'center', color: '#222', marginBottom: '25px', fontWeight: 500 }}>
            Uploader & Certifier un rapport
          </h2>
          
          <UploadAndStore />

          <div style={{ marginTop: '35px', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
            <p>💡 Connecte MetaMask pour interagir avec la blockchain Ganache</p>
            <p>© 2025 Système d'audit intelligent</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
