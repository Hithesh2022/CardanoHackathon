# AtlasCred Deployment Guide

## Architecture
- **Frontend**: Deployed on Render (Next.js)
- **Backend + Masumi + Proof Server**: Local Docker with public tunnel

## Step-by-Step Deployment

### 1. Run Local Services with Docker

```powershell
# From repo root
docker compose up -d --build
```

This starts:
- Backend: `http://localhost:4000`
- Masumi Agent: `http://localhost:8000`
- Midnight Proof Server: `http://localhost:8080`

Verify services:
```powershell
docker ps
docker logs atlascred-backend --tail=50
curl http://localhost:4000/health
```

### 2. Expose Backend Publicly

**Option A: Cloudflare Tunnel (Recommended)**

```powershell
# Install
winget install Cloudflare.cloudflared

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create atlascred-backend

# Run tunnel (keep this running)
cloudflared tunnel run atlascred-backend --url http://localhost:4000
```

Copy the public URL from output (e.g., `https://abc123.cfargotunnel.com`)

**Option B: ngrok**

```powershell
choco install ngrok
ngrok config add-authtoken <YOUR_TOKEN>
ngrok http 4000
```

Copy the public URL (e.g., `https://xyz.ngrok.io`)

### 3. Deploy Frontend to Render

1. **Update `render.yaml`**:
   - Replace `YOUR_TUNNEL_URL_HERE` with your tunnel URL

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Configure for Render deployment"
   git push origin dp_v1
   ```

3. **Create Render Service**:
   - Go to https://dashboard.render.com
   - New → Web Service
   - Connect your repo
   - Select branch: `dp_v1`
   - Render auto-detects `render.yaml`
   - Only create `atlascred-frontend` service
   - Set environment variable: `NEXT_PUBLIC_API_BASE` = your tunnel URL
   - Deploy!

4. **Access your app**:
   - Frontend: `https://atlascred-frontend.onrender.com`
   - Backend: your tunnel URL (e.g., `https://abc123.cfargotunnel.com`)

### 4. Update Backend CORS (if needed)

If frontend gets CORS errors, update `backend/src/index.ts`:

```typescript
app.use(cors({
  origin: 'https://atlascred-frontend.onrender.com',
  credentials: true
}));
```

Then restart Docker:
```powershell
docker compose restart backend
```

### 5. Keep Services Running

**Docker Services**:
- Run as daemon: `docker compose up -d`
- View logs: `docker logs -f atlascred-backend`
- Stop: `docker compose down`

**Tunnel**:
- Keep the `cloudflared tunnel run` command running
- For production, install as Windows service:
  ```powershell
  cloudflared service install
  ```

## Troubleshooting

### Backend not reachable
```powershell
# Check Docker
docker ps
docker logs atlascred-backend

# Check tunnel
# Cloudflare: visit tunnel URL in browser
# ngrok: check ngrok dashboard
```

### Frontend CORS errors
- Ensure backend CORS allows your frontend origin
- Check tunnel URL is correct in Render env vars

### Contract/proof server issues
- Backend uses placeholder proofs when `MIDNIGHT_CONTRACT_ADDRESS` is empty
- Payment spoof still works without real proof server
- Masumi agent has local fallback if unreachable

## Environment Variables Summary

**Backend (Docker)**: Set in `docker-compose.yml`
- `MIDNIGHT_PROOF_SERVER=http://proof:8080`
- `MASUMI_AGENT_URL=http://masumi:8000`
- `MIDNIGHT_CONTRACT_ADDRESS=` (empty for placeholder)

**Frontend (Render)**: Set in Render dashboard
- `NEXT_PUBLIC_API_BASE=https://your-tunnel-url`
- `NEXT_PUBLIC_DUST_TREASURY_ADDRESS=midnight1qxyzdusttreasury`
- `NEXT_PUBLIC_DUST_ASSET_ID=DUST`

## Cost Breakdown

- **Render Frontend**: Free tier (or $7/month for always-on)
- **Local Docker**: Free (uses your machine)
- **Cloudflare Tunnel**: Free
- **ngrok**: Free tier (or paid for stable domain)

## Production Recommendations

1. **Use Cloudflare Tunnel** over ngrok (more stable, better security)
2. **Set up Docker restart policies**: Add `restart: unless-stopped` in `docker-compose.yml`
3. **Enable HTTPS**: Tunnel provides HTTPS automatically
4. **Monitor logs**: Use `docker compose logs -f` to watch for issues
5. **Backup**: Keep `docker-compose.yml` and `.env` files secure
