Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Intelligent Audit & Traceability System     " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

$RootPath = Get-Location

# Check Ganache
$ganache = Get-NetTCPConnection -LocalPort 7545 -ErrorAction SilentlyContinue
if (-not $ganache) {
    Write-Warning "Ganache does not seem to be running on port 7545."
}

# Start Backend
Write-Host "[1/2] Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootPath\backend'; `$Host.UI.RawUI.WindowTitle = 'Backend API - FastAPI'; python main.py"

# Start Frontend
Write-Host "[2/2] Starting Frontend App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootPath\frontend'; `$Host.UI.RawUI.WindowTitle = 'Frontend - React'; npm start"

Write-Host ""
Write-Host "Success! Components are launching in separate windows." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "===============================================" -ForegroundColor Cyan
