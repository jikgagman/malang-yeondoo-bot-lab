$ErrorActionPreference = "SilentlyContinue"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$LiveUrl = "http://127.0.0.1:4173/api/live"
$TiltUrl = if ($env:TILT_API_URL) { $env:TILT_API_URL } else { "https://malang-yeondoo-bot-lab.onrender.com/api/tilt" }
$PollMs = 2000
$GameIsActive = $false
$SessionId = ""
$Counts = @{
  malang = 0
  yeondoo = 0
}

function New-SessionId {
  return "game-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
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
  } catch {
    [System.Media.SystemSounds]::Beep.Play()
  }
}

function Update-Counts {
  $script:MalangButton.Text = "말랑`r`n$($script:Counts.malang)"
  $script:YeondooButton.Text = "연두`r`n$($script:Counts.yeondoo)"
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
  }
  $script:GameIsActive = $true
  $script:Form.Location = New-Object System.Drawing.Point(14, 14)
  $script:Form.Show()
  $script:Form.TopMost = $true
  $script:Form.Activate()
}

function Hide-Overlay {
  if ($script:GameIsActive) {
    $script:GameIsActive = $false
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
$header.Size = New-Object System.Drawing.Size(44, 18)
$script:Form.Controls.Add($header)

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
  try {
    $live = Invoke-RestMethod -Uri $LiveUrl -TimeoutSec 2
    if ($live.phase -eq "InProgress") {
      Show-Overlay
    } else {
      Hide-Overlay
    }
  } catch {
    Hide-Overlay
  }
})

$script:Form.Add_Shown({
  $script:Form.Hide()
  $timer.Start()
})

[System.Windows.Forms.Application]::Run($script:Form)
