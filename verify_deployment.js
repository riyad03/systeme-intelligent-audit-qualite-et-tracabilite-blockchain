const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    // 1. Setup Provider (Ganache)
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

    // 2. Get the deployed contract address and ABI
    const artifactPath = path.join(__dirname, "frontend", "src", "contracts", "AuditTraceability.json");
    if (!fs.existsSync(artifactPath)) {
        console.error("Artifact not found!");
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const networkId = "5777";
    const deployedNetwork = artifact.networks[networkId];
    const contractAddress = deployedNetwork.address;

    console.log(`Checking connection to Ganache...`);
    const network = await provider.getNetwork();
    console.log(`Connected to Chain ID: ${network.chainId}`);

    console.log(`Checking Contract at: ${contractAddress}`);

    // 3. Create Contract Instance
    // Note: To write we need a signer, but we can verify read access without one if the contract allows, 
    // or just checking if code exists at address.

    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
        console.error("NO CONTRACT FOUND AT THIS ADDRESS! The frontend will fail.");
        process.exit(1);
    } else {
        console.log("SUCCESS: Smart Contract bytecode found at address.");
    }

    // 4. Try a read operation (reportCount)
    const contract = new ethers.Contract(contractAddress, artifact.abi, provider);
    try {
        const count = await contract.reportCount();
        console.log(`Current Report Count: ${count.toString()}`);
        console.log("Read operation successful!");

        // 5. Try a write operation (Certification)
        // We need a signer (simulating user wallet)
        const signer = await provider.getSigner(0); // Account #0
        const contractWithSigner = contract.connect(signer);

        console.log("Attempting certification transaction...");
        const tx = await contractWithSigner.certifyReport(new Date().toISOString(), "test_hash_123");
        console.log(`Transaction sent! Hash: ${tx.hash}`);
        await tx.wait();
        console.log("Transaction confirmed!");

        const newCount = await contract.reportCount();
        console.log(`New Report Count: ${newCount.toString()}`);

    } catch (e) {
        console.error("Interaction failed:", e);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
