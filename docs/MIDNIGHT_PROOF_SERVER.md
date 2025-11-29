# Midnight Proof Server Setup (Docker)

## Overview

This guide shows you how to run the Midnight proof server locally using Docker instead of deploying to the real Midnight blockchain. This is useful for development and testing.

## Prerequisites

- Docker installed on your system
- WSL2 (if on Windows) or native Linux/Ubuntu
- Port 6300 available

## Setup Instructions

### 1. Pull the Midnight Proof Server Image

```bash
docker pull midnightnetwork/proof-server:latest
```

### 2. Run the Proof Server (Testnet Mode)

```bash
docker run -d \
  --name midnight-proof-server \
  -p 6300:6300 \
  midnightnetwork/proof-server:latest \
  midnight-proof-server --network testnet
```

**Explanation**:
- `-d`: Run in detached mode (background)
- `--name`: Give the container a friendly name
- `-p 6300:6300`: Map port 6300 from container to host
- `--network testnet`: Use Midnight testnet (not mainnet)

### 3. Verify Server is Running

Check if the container is running:

```bash
docker ps | grep midnight-proof-server
```

Check logs:

```bash
docker logs midnight-proof-server
```

Test the API endpoint:

```bash
curl http://localhost:6300/health
```

Expected response:

```json
{
  "status": "ok",
  "network": "testnet",
  "version": "0.1.0"
}
```

### 4. Configure AtlasCred Backend

The backend is already configured to use the proof server. The default URL is `http://localhost:6300`.

To change it, set the environment variable in `backend/.env`:

```bash
MIDNIGHT_PROOF_SERVER=http://localhost:6300
```

### 5. Test the Integration

1. Start the backend:

```bash
cd backend
npm run dev
```

2. Generate a credit score from the frontend
3. Check backend logs for:

```
🌙 Connecting to Midnight proof server: http://localhost:6300
✅ Midnight ZK proof generated: midnight-proof-...
```

## Troubleshooting

### Container Won't Start

Check if port 6300 is already in use:

```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 6300

# Linux/WSL
sudo lsof -i :6300
```

### Proof Server Unavailable

If the proof server is down, the backend will automatically fall back to local proof generation:

```
⚠️ Midnight proof server unavailable, using local proof generation
```

This is fine for development, but proofs won't be on-chain.

### Docker on Windows/WSL

If using WSL2 on Windows, make sure Docker Desktop is running and WSL integration is enabled:

1. Open Docker Desktop
2. Go to Settings → Resources → WSL Integration
3. Enable integration with your WSL distro (Ubuntu)
4. Restart WSL: `wsl --shutdown` (in PowerShell)

## Container Management

### Stop the Server

```bash
docker stop midnight-proof-server
```

### Start the Server Again

```bash
docker start midnight-proof-server
```

### Remove the Container

```bash
docker rm -f midnight-proof-server
```

### View Real-Time Logs

```bash
docker logs -f midnight-proof-server
```

### Restart the Server

```bash
docker restart midnight-proof-server
```

## API Endpoints

The Midnight proof server exposes these endpoints:

### Health Check

```bash
GET http://localhost:6300/health
```

### Create Proof

```bash
POST http://localhost:6300/api/proof/create
Content-Type: application/json

{
  "ownerAddress": "addr1...",
  "exactScore": 750,
  "scoreHash": "abc123...",
  "scoreBucket": 3,
  "nonce": "random-hex",
  "documentHashes": ["hash1", "hash2"],
  "documentVerification": {
    "mobile": true,
    "aadhaar": true,
    "pan": false,
    "bank": true
  },
  "trustBoost": 15,
  "expiresAt": 1700000000000,
  "network": "testnet"
}
```

Response:

```json
{
  "proofId": "midnight-proof-uuid",
  "contractAddress": "midnight-contract-...",
  "txHash": "midnight-tx-...",
  "status": "confirmed"
}
```

### Verify Proof

```bash
GET http://localhost:6300/api/proof/verify/:proofId
```

Response:

```json
{
  "valid": true,
  "scoreBucket": 3,
  "isActive": true,
  "expiresAt": "2024-11-29T..."
}
```

## Production Deployment

For production, you would deploy to the real Midnight blockchain instead of using the local proof server:

1. Get Midnight testnet/mainnet access
2. Deploy the Compact contract from `contracts/midnight/`
3. Update `MIDNIGHT_RPC` in backend `.env`
4. Remove or comment out `MIDNIGHT_PROOF_SERVER`

## Architecture

```
Frontend (Next.js)
    ↓
Backend (Express)
    ↓
Midnight Bridge Service
    ↓
Docker Container (port 6300)
    ↓
Midnight Proof Server (testnet)
    ↓
Zero-Knowledge Proofs
```

## Benefits of Local Proof Server

- ✅ **No Real Blockchain Needed**: Test ZK proofs without deploying to Midnight
- ✅ **Faster Development**: Instant proof generation (no tx confirmation wait)
- ✅ **Cost-Free**: No gas fees or testnet tokens needed
- ✅ **Offline Development**: Work without internet connection
- ✅ **Debugging**: Access to proof server logs for troubleshooting

## Next Steps

1. Start the proof server: `docker run -p 6300:6300 midnightnetwork/proof-server:latest midnight-proof-server --network testnet`
2. Run backend: `npm run dev` (in backend folder)
3. Run frontend: `npm run dev` (in frontend folder)
4. Generate a credit score and watch the logs!

## Support

- Midnight Documentation: https://docs.midnight.network
- Docker Documentation: https://docs.docker.com
- AtlasCred Issues: https://github.com/Hithesh2022/CardanoHackathon/issues
