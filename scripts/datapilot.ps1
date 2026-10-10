
param(
    [Parameter(Position = 0)]
    [ValidateSet("status", "update", "push", "watch")]
    [string]$Command = "status",

    [Parameter(Position = 1)]
    [string]$Message = "Update DataPilot AI"
)

$ErrorActionPreference = "Stop"

# Resolve the repository root from scripts/datapilot.ps1
$Repo = Split-Path -Parent $PSScriptRoot
Set-Location $Repo

function Invoke-Git {
    param([string[]]$GitArgs)

    & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($GitArgs -join ' ')"
    }
}

function Test-CleanWorkingTree {
    & git diff --quiet
    if ($LASTEXITCODE -ne 0) { return $false }

    & git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) { return $false }

    $changes = @(git ls-files --others --exclude-standard)
    if ($LASTEXITCODE -ne 0) {
        throw "Could not inspect untracked files."
    }

    return ($changes.Count -eq 0)
}

function Update-Repository {
    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or !$branch) {
        throw "Could not determine the current branch."
    }

    if (!(Test-CleanWorkingTree)) {
        Write-Warning "Local changes or untracked files exist."
        Write-Host "Commit or safely preserve your work before updating."
        Write-Host "No files were overwritten."
        return
    }

    Invoke-Git @("fetch", "origin")

    $remoteBranch = "origin/$branch"
    & git show-ref --verify --quiet "refs/remotes/$remoteBranch"
    if ($LASTEXITCODE -ne 0) {
        throw "Remote branch '$remoteBranch' was not found."
    }

    $behind = (& git rev-list --count "HEAD..$remoteBranch").Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Could not inspect incoming commits."
    }

    if ([int]$behind -eq 0) {
        Write-Host "Already up to date." -ForegroundColor Green
        return
    }

    Invoke-Git @("pull", "--ff-only", "origin", $branch)
    Write-Host "Repository updated successfully." -ForegroundColor Green
}

switch ($Command) {
    "status" {
        Invoke-Git @("status", "--short", "--branch")
        Invoke-Git @("remote", "-v")
    }

    "update" {
        Update-Repository
    }

    "push" {
        if ([string]::IsNullOrWhiteSpace($Message)) {
            throw "Provide a commit message."
        }

        # Stage modifications and deletions of tracked files only.
        Invoke-Git @("add", "-u")

        & git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Host "No staged changes to commit."
            Write-Host "Stage new files explicitly with git add <path>."
            return
        }
        if ($LASTEXITCODE -ne 1) {
            throw "Could not inspect staged changes."
        }

        Invoke-Git @("commit", "-m", $Message)

        $branch = (& git branch --show-current).Trim()
        if ($LASTEXITCODE -ne 0 -or !$branch) {
            throw "Could not determine the current branch."
        }

        Invoke-Git @("push", "origin", $branch)
        Write-Host "Changes pushed successfully." -ForegroundColor Green
    }

    "watch" {
        Write-Host "Watching GitHub every 30 seconds."
        Write-Host "Press Ctrl+C to stop."

        while ($true) {
            try {
                Update-Repository
            }
            catch {
                Write-Warning $_
            }

            Start-Sleep -Seconds 30
        }
    }
}

