# Quick Start Script for Local Docker + Tunnel

Write-Host "🚀 AtlasCred Deployment Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Step 1: Build and start Docker services
Write-Host "📦 Step 1: Starting Docker services..." -ForegroundColor Yellow
docker compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker compose failed. Check Docker Desktop is running." -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 5

# Step 2: Verify services
Write-Host "`n✅ Step 2: Verifying services..." -ForegroundColor Yellow
Write-Host "Checking backend..."
$backendHealth = try { Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -TimeoutSec 5 } catch { $null }
if ($backendHealth) {
    Write-Host "  ✓ Backend running on http://localhost:4000" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend not responding" -ForegroundColor Red
}

Write-Host "Checking Masumi agent..."
$masumiHealth = try { Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5 } catch { $null }
if ($masumiHealth) {
    Write-Host "  ✓ Masumi agent running on http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "  ✗ Masumi agent not responding" -ForegroundColor Red
}

# Step 3: Setup tunnel instructions
Write-Host "`n🌐 Step 3: Expose backend publicly" -ForegroundColor Yellow
Write-Host "Run ONE of these commands in a separate terminal:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option A - Cloudflare Tunnel (Recommended):" -ForegroundColor White
Write-Host "  cloudflared tunnel run atlascred-backend --url http://localhost:4000" -ForegroundColor Gray
Write-Host ""
Write-Host "Option B - ngrok:" -ForegroundColor White
Write-Host "  ngrok http 4000" -ForegroundColor Gray
Write-Host ""

# Step 4: Next steps
Write-Host "`n📝 Step 4: After starting tunnel:" -ForegroundColor Yellow
Write-Host "  1. Copy the public URL from tunnel output"
Write-Host "  2. Update render.yaml: Replace YOUR_TUNNEL_URL_HERE with your URL"
Write-Host "  3. Deploy frontend to Render:"
Write-Host "     git add ."
Write-Host "     git commit -m 'Deploy config'"
Write-Host "     git push origin dp_v1"
Write-Host "  4. In Render dashboard, set NEXT_PUBLIC_API_BASE to your tunnel URL"
Write-Host ""

Write-Host "📊 View logs:" -ForegroundColor Yellow
Write-Host "  docker logs -f atlascred-backend"
Write-Host "  docker logs -f masumi-agent"
Write-Host ""

Write-Host "🛑 Stop services:" -ForegroundColor Yellow
Write-Host "  docker compose down"
Write-Host ""

Write-Host "✅ Setup complete! Start your tunnel now." -ForegroundColor Green
