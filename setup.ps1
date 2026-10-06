# keepnote setup script for Windows
# Run: .\setup.ps1
# Requires: node, pnpm, git, gh (GitHub CLI)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  keepnote setup" -ForegroundColor Yellow
Write-Host "  ─────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── Check dependencies ──────────────────────────────────────

function Check-Command($name, $installHint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Host "  ✗ $name not found" -ForegroundColor Red
        Write-Host "    Install: $installHint" -ForegroundColor DarkGray
        return $false
    }
    $version = & $name --version 2>&1 | Select-Object -First 1
    Write-Host "  ✓ $name ($version)" -ForegroundColor Green
    return $true
}

$ok = $true
if (-not (Check-Command "node" "https://nodejs.org")) { $ok = $false }
if (-not (Check-Command "pnpm" "npm install -g pnpm")) { $ok = $false }
if (-not (Check-Command "git" "https://git-scm.com")) { $ok = $false }
if (-not (Check-Command "gh" "https://cli.github.com")) { $ok = $false }

if (-not $ok) {
    Write-Host ""
    Write-Host "  Missing dependencies. Install them and re-run." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ── Install packages ────────────────────────────────────────

Write-Host "  Installing packages..." -ForegroundColor Cyan
pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "  pnpm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Packages installed" -ForegroundColor Green
Write-Host ""

# ── Git init ────────────────────────────────────────────────

if (-not (Test-Path ".git")) {
    Write-Host "  Initializing git..." -ForegroundColor Cyan

    # Create .gitignore
    @"
node_modules
dist
.vite
*.local
"@ | Out-File -Encoding utf8 .gitignore

    git init
    git add -A
    git commit -m "initial commit: keepnote v0.1.0"
    Write-Host "  ✓ Git initialized" -ForegroundColor Green
} else {
    Write-Host "  ✓ Git already initialized" -ForegroundColor Green
}

Write-Host ""

# ── GitHub repo ─────────────────────────────────────────────

$repoName = "keepnote"

Write-Host "  Push to GitHub as public repo '$repoName'? (y/n) " -ForegroundColor Cyan -NoNewline
$answer = Read-Host

if ($answer -eq "y" -or $answer -eq "Y") {
    Write-Host "  Creating GitHub repo..." -ForegroundColor Cyan
    gh repo create $repoName --public --source=. --push

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Pushed to GitHub" -ForegroundColor Green
    } else {
        Write-Host "  ✗ GitHub push failed (repo may already exist)" -ForegroundColor Yellow
        Write-Host "    Try: gh repo create $repoName --public --source=. --push" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  Skipped GitHub push" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  ─────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Ready! Run: pnpm dev" -ForegroundColor Yellow
Write-Host ""
