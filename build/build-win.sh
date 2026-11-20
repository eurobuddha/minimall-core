#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# miniMall Studio — Windows one-click installer (cross-built on macOS).
# Prereqs: brew install nsis   (pkg is auto-fetched by npx)
# Usage:   npm run build:win
# Produces: release/miniMall-Studio-<ver>-Setup.exe  (wraps a self-contained pkg .exe)
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION="0.1.3"
OUT_DIR="$PROJECT_DIR/release"

command -v makensis >/dev/null 2>&1 || { echo "❌  makensis not found. Install with: brew install nsis"; exit 1; }
mkdir -p "$OUT_DIR"

echo "🔨  Compiling standalone Windows .exe (pkg, node22-win-x64)…"
cat > "$PROJECT_DIR/pkg.config.json" <<'PKGEOF'
{ "pkg": { "scripts": ["src/**/*.js"], "assets": ["web/**/*"] } }
PKGEOF
( cd "$PROJECT_DIR" && npx @yao-pkg/pkg src/studio.js \
    --config pkg.config.json --targets node22-win-x64 \
    --output "release/miniMall Studio.exe" --compress GZip )
rm -f "$PROJECT_DIR/pkg.config.json"

echo "📦  Building NSIS one-click installer…"
( cd "$SCRIPT_DIR" && makensis installer.nsi )

echo "✓  release/miniMall-Studio-${VERSION}-Setup.exe"
