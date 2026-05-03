$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  & node "node_modules\typescript\bin\tsc" -b
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  & node "scripts\build.mjs"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  & node "node_modules\tailwindcss\lib\cli.js" -i "src\styles.css" -o "dist\assets\styles.css" --minify
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  Pop-Location
}
