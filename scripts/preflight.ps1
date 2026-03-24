$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$preflightScript = Join-Path $PSScriptRoot "preflight.py"

function Test-PythonCandidate {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,

        [string[]]$Arguments = @()
    )

    try {
        & $Command @Arguments "--version" *> $null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Find-PythonCommand {
    $candidates = @()

    if ($env:PYTHON) {
        $candidates += @{
            Command = $env:PYTHON
            Arguments = @()
        }
    }

    $candidates += @(
        @{ Command = "py"; Arguments = @("-3") },
        @{ Command = "python3"; Arguments = @() },
        @{ Command = "python"; Arguments = @() }
    )

    $explicitPaths = @(
        (Join-Path ${env:ProgramFiles} "Microsoft SDKs\Azure\CLI2\python.exe"),
        (Join-Path ${env:LocalAppData} "Programs\Python\Python313\python.exe"),
        (Join-Path ${env:LocalAppData} "Programs\Python\Python312\python.exe"),
        (Join-Path ${env:LocalAppData} "Programs\Python\Python311\python.exe"),
        (Join-Path ${env:LocalAppData} "Programs\Python\Python310\python.exe")
    )

    foreach ($path in $explicitPaths) {
        if ($path -and (Test-Path $path)) {
            $candidates += @{
                Command = $path
                Arguments = @()
            }
        }
    }

    foreach ($candidate in $candidates) {
        if (Test-PythonCandidate -Command $candidate.Command -Arguments $candidate.Arguments) {
            return $candidate
        }
    }

    return $null
}

$python = Find-PythonCommand

if (-not $python) {
    Write-Error "No working Python interpreter was found. Set PYTHON to a Python 3 executable or install Python 3 and retry."
}

Push-Location $repoRoot
try {
    & $python.Command @($python.Arguments + $preflightScript)
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
