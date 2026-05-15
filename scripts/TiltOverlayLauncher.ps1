$ErrorActionPreference = "SilentlyContinue"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$TiltUrl = if ($env:TILT_API_URL) { $env:TILT_API_URL } else { "https://malang-yeondoo-bot-lab.onrender.com/api/tilt" }
$LogFile = Join-Path $env:TEMP "MalangYeondooOverlay.log"
$PollMs = 2000
$GameIsActive = $false
$SessionId = ""
$LastPhase = ""
$LastLockfilePath = ""
$LastLockfileLogAt = Get-Date "2000-01-01"
$Counts = @{
  malang = 0
  yeondoo = 0
}

[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

function New-SessionId {
  return "game-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
}

function Write-OverlayLog {
  param([string]$Message)
  $line = "$(Get-Date -Format "yyyy-MM-dd HH:mm:ss") $Message"
  Add-Content -Path $script:LogFile -Value $line
}

function Get-LockfilePath {
  $candidates = @()
  if ($env:LCU_LOCKFILE) {
    $candidates += $env:LCU_LOCKFILE
  }

  foreach ($drive in @("C", "D", "E", "F", "G")) {
    $candidates += @(
      "${drive}:\Riot Games\League of Legends\lockfile",
      "${drive}:\Program Files\Riot Games\League of Legends\lockfile",
      "${drive}:\Program Files (x86)\Riot Games\League of Legends\lockfile",
      "${drive}:\League of Legends\lockfile",
      "${drive}:\LOL\League of Legends\lockfile",
      "${drive}:\Games\League of Legends\lockfile"
    )
  }

  foreach ($path in $candidates) {
    if (Test-Path $path) {
      if ($script:LastLockfilePath -ne $path) {
        $script:LastLockfilePath = $path
        Write-OverlayLog "lockfile found: $path"
      }
      return $path
    }
  }

  if (((Get-Date) - $script:LastLockfileLogAt).TotalSeconds -gt 30) {
    $script:LastLockfileLogAt = Get-Date
    Write-OverlayLog "lockfile not found. Set LCU_LOCKFILE if LoL is installed in a custom PC-bang path."
  }
  return $null
}

function Get-GameflowPhase {
  $lockfilePath = Get-LockfilePath
  if (-not $lockfilePath) {
    Set-StatusText "LoL 대기"
    return "Disconnected"
  }

  $lockfileContent = Get-Content $lockfilePath -Raw -ErrorAction SilentlyContinue
  if (-not $lockfileContent) {
    Write-OverlayLog "empty lockfile: $lockfilePath"
    Set-StatusText "lockfile 대기"
    return "Disconnected"
  }

  $parts = $lockfileContent.Trim().Split(":")
  if ($parts.Length -lt 5) {
    Write-OverlayLog "invalid lockfile format: $lockfilePath"
    Set-StatusText "lockfile 오류"
    return "Disconnected"
  }

  $port = $parts[2]
  $password = $parts[3]
  $authBytes = [System.Text.Encoding]::UTF8.GetBytes("riot:$password")
  $auth = [Convert]::ToBase64String($authBytes)

  try {
    $phase = Invoke-RestMethod `
      -Uri "https://127.0.0.1:$port/lol-gameflow/v1/gameflow-phase" `
      -Headers @{ Authorization = "Basic $auth" } `
      -TimeoutSec 2
    return $phase
  } catch {
    Write-OverlayLog "LCU request failed: $($_.Exception.Message)"
    Set-StatusText "LCU 연결 대기"
    return "Disconnected"
  }
}

function Invoke-TiltCount {
  param([string]$Player)

  $body = @{
    player = $Player
    phase = "windows-game-overlay"
    sessionId = $script:SessionId
  } | ConvertTo-Json -Compress

  try {
    Invoke-RestMethod -Uri $script:TiltUrl -Method Post -ContentType "application/json" -Body $body -TimeoutSec 4 | Out-Null
    $script:Counts[$Player] = [int]$script:Counts[$Player] + 1
    Update-Counts
    Write-OverlayLog "tilt counted: $Player session=$($script:SessionId)"
  } catch {
    Write-OverlayLog "tilt API failed: $($_.Exception.Message)"
    [System.Media.SystemSounds]::Beep.Play()
  }
}

function Update-Counts {
  $script:MalangButton.Text = "말랑`r`n$($script:Counts.malang)"
  $script:YeondooButton.Text = "연두`r`n$($script:Counts.yeondoo)"
}

function Set-StatusText {
  param([string]$Text)
  if ($script:StatusLabel) {
    $script:StatusLabel.Text = $Text
  }
}

function Reset-Game {
  $script:SessionId = New-SessionId
  $script:Counts.malang = 0
  $script:Counts.yeondoo = 0
  Update-Counts
}

function Show-Overlay {
  if (-not $script:GameIsActive) {
    Reset-Game
    Write-OverlayLog "overlay shown session=$($script:SessionId)"
  }
  $script:GameIsActive = $true
  $script:Form.Location = New-Object System.Drawing.Point(14, 14)
  Set-StatusText "게임 중"
  $script:Form.Show()
  $script:Form.TopMost = $true
  $script:Form.Activate()
}

function Hide-Overlay {
  if ($script:GameIsActive) {
    $script:GameIsActive = $false
    Write-OverlayLog "overlay hidden"
    $script:Form.Hide()
  }
}

$script:Form = New-Object System.Windows.Forms.Form
$script:Form.Text = "짜증"
$script:Form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedToolWindow
$script:Form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$script:Form.Location = New-Object System.Drawing.Point(14, 14)
$script:Form.Size = New-Object System.Drawing.Size(214, 96)
$script:Form.TopMost = $true
$script:Form.ShowInTaskbar = $false
$script:Form.BackColor = [System.Drawing.Color]::FromArgb(255, 251, 241)
$script:Form.Font = New-Object System.Drawing.Font("Malgun Gothic", 9, [System.Drawing.FontStyle]::Bold)

$header = New-Object System.Windows.Forms.Label
$header.Text = "짜증"
$header.Location = New-Object System.Drawing.Point(10, 7)
$header.Size = New-Object System.Drawing.Size(42, 18)
$script:Form.Controls.Add($header)

$script:StatusLabel = New-Object System.Windows.Forms.Label
$script:StatusLabel.Text = "LoL 대기"
$script:StatusLabel.Location = New-Object System.Drawing.Point(56, 7)
$script:StatusLabel.Size = New-Object System.Drawing.Size(105, 18)
$script:StatusLabel.ForeColor = [System.Drawing.Color]::FromArgb(92, 100, 116)
$script:Form.Controls.Add($script:StatusLabel)

$resetButton = New-Object System.Windows.Forms.Button
$resetButton.Text = "↻"
$resetButton.Location = New-Object System.Drawing.Point(171, 4)
$resetButton.Size = New-Object System.Drawing.Size(28, 24)
$resetButton.Add_Click({ Reset-Game })
$script:Form.Controls.Add($resetButton)

$script:MalangButton = New-Object System.Windows.Forms.Button
$script:MalangButton.Text = "말랑`r`n0"
$script:MalangButton.Location = New-Object System.Drawing.Point(10, 32)
$script:MalangButton.Size = New-Object System.Drawing.Size(88, 44)
$script:MalangButton.BackColor = [System.Drawing.Color]::FromArgb(205, 248, 223)
$script:MalangButton.Add_Click({ Invoke-TiltCount "malang" })
$script:Form.Controls.Add($script:MalangButton)

$script:YeondooButton = New-Object System.Windows.Forms.Button
$script:YeondooButton.Text = "연두`r`n0"
$script:YeondooButton.Location = New-Object System.Drawing.Point(111, 32)
$script:YeondooButton.Size = New-Object System.Drawing.Size(88, 44)
$script:YeondooButton.BackColor = [System.Drawing.Color]::FromArgb(255, 215, 223)
$script:YeondooButton.Add_Click({ Invoke-TiltCount "yeondoo" })
$script:Form.Controls.Add($script:YeondooButton)

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = $PollMs
$timer.Add_Tick({
  $phase = Get-GameflowPhase
  if ($script:LastPhase -ne $phase) {
    $script:LastPhase = $phase
    Write-OverlayLog "gameflow phase: $phase"
    if ($phase -ne "InProgress") {
      Set-StatusText $phase
    }
  }
  if ($phase -eq "InProgress") {
    Show-Overlay
  } else {
    Hide-Overlay
  }
})

$script:Form.Add_Shown({
  Write-OverlayLog "launcher started. log=$($script:LogFile)"
  $script:Form.Hide()
  $timer.Start()
})

[System.Windows.Forms.Application]::Run($script:Form)
