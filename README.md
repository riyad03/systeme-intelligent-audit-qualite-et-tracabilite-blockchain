# Système Intelligent d'Audit & Traçabilité Blockchain

Application intelligente combinant IA et blockchain pour l'audit d'entreprise.

## 🚀 Quick Start

### 1. Configuration Backend
```bash
cd backend
# Créer fichier .env avec votre clé OpenAI:
echo OPENAI_API_KEY=sk-your-key-here > .env
python main.py
```

### 2. Démarrage Frontend
```bash
cd frontend
npm start
```

### 3. Blockchain (Ganache)
- Démarrer Ganache sur port 7545
- Déployer: `npx truffle migrate`
- Importer compte dans MetaMask

## 📋 Fonctionnalités

- **Agent IA 1**: Analyse de données (nettoyage, statistiques, détection d'anomalies)
- **Agent IA 2**: Recommandations business
- **PDF**: Génération de rapports signés
- **Blockchain**: Certification des rapports (hash immuable)
- **Power BI**: Export CSV pour dashboards

## 🔗 URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📊 Power BI

Fichier: `backend/audit_history.csv`
- Colonnes: filename, timestamp, quality_score, report_hash

## 📖 Documentation Complète

Voir `walkthrough.md` dans les artifacts pour le guide détaillé.

## 🛠️ Stack Technique

- **Backend**: FastAPI, LangChain, Pandas, ReportLab
- **Frontend**: React, Ethers.js, Chart.js
- **Blockchain**: Solidity, Truffle, Ganache
- **IA**: OpenAI GPT-4
