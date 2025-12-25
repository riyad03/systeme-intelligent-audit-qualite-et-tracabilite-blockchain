# Blockchain Setup Instructions

## Issue: "Blockchain contract not connected"

### Steps to Fix:

1. **Start Ganache**
   - Open Ganache application
   - Create/Open a workspace
   - **IMPORTANT**: Make sure it's running on port **7545**
   - Leave it running in the background

2. **Deploy the Smart Contract**
   ```bash
   cd "C:\Users\Administrator\Documents\projet pfa"
   npx truffle migrate --network development
   ```
   
   You should see output like:
   ```
   Deploying 'ReportStorage'
   --------------------------
   > contract address:    0x...
   > block number:        ...
   ```

3. **Configure MetaMask**
   
   **Add Ganache Network:**
   - Open MetaMask
   - Click network dropdown (top)
   - Click "Add network" → "Add network manually"
   - Fill in:
     - Network name: `Ganache Local`
     - RPC URL: `http://127.0.0.1:7545`
     - Chain ID: `1337`
     - Currency symbol: `ETH`
   - Click Save
   
   **Import Account:**
   - In MetaMask, click account icon (top right)
   - "Import Account"
   - Paste a private key from Ganache (click key icon in Ganache next to any account)
   - Click Import

4. **Refresh the React App**
   - Go to http://localhost:3000
   - Refresh the page (F5)
   - MetaMask should now connect automatically
   - Try "Certify on Blockchain" again

## Quick Check

Run this to verify Ganache is running:
```bash
curl http://127.0.0.1:7545
```

If you get a response, Ganache is running. If not, start Ganache first!
