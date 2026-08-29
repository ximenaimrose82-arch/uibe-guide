# ============================================================
# 贸大新生指南 · 分享图 & 图标生成脚本 (Windows PowerShell)
# 用法:  pwsh tools/gen-icons.ps1
# 产出:  share.png (1200x630 OG 分享卡)
#         assets/icon-180.png (Apple Touch Icon)
#         assets/icon-192.png / assets/icon-512.png (PWA)
# 依赖:  System.Drawing (Windows 自带, 无需安装)
# ============================================================
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assetsDir = Join-Path $root 'assets'
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

$red = [System.Drawing.Color]::FromArgb(200, 16, 46)      # --red  #c8102e
$red2 = [System.Drawing.Color]::FromArgb(224, 54, 79)     # 渐变亮端
$white = [System.Drawing.Color]::White
$fontTitle = New-Object System.Drawing.Font('Microsoft YaHei', 78, [System.Drawing.FontStyle]::Bold)
$fontSub   = New-Object System.Drawing.Font('Microsoft YaHei', 30)
$fontChip  = New-Object System.Drawing.Font('Microsoft YaHei', 24, [System.Drawing.FontStyle]::Bold)
$fontFoot  = New-Object System.Drawing.Font('Microsoft YaHei', 20)

function New-RoundPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function Draw-Centered-Text($g, [string]$text, $font, $color, [float]$cx, [float]$cy) {
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF($cx - 600, $cy - 60, 1200, 120)
  $g.DrawString($text, $font, $brushColor, $rect, $sf)
  $sf.Dispose()
}

# ---------- 1) share.png (1200x630) ----------
$bmp = New-Object System.Drawing.Bitmap 1200, 630
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle(0, 0, 1200, 630)), $red, $red2, 45)
$g.FillRectangle($grad, 0, 0, 1200, 630)

# 标题
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$brushTitle = New-Object System.Drawing.SolidBrush $white
$g.DrawString('贸大新生指南', $fontTitle, $brushTitle, (New-Object System.Drawing.RectangleF(0, 120, 1200, 120)), $sf)
$g.DrawString('UIBE GUIDE · 2026级新生入学指南', $fontSub, $brushTitle,
  (New-Object System.Drawing.RectangleF(0, 255, 1200, 60)), $sf)

# 功能胶囊
$chips = @('报到', '军训', '选课', '生活', '防骗')
$chipW = 120; $chipH = 52; $gap = 22
$total = $chips.Count * $chipW + ($chips.Count - 1) * $gap
$startX = (1200 - $total) / 2
$chipBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(60, 255, 255, 255))
$chipBrush2 = New-Object System.Drawing.SolidBrush $white
$i = 0
foreach ($c in $chips) {
  $x = $startX + $i * ($chipW + $gap)
  $path = New-RoundPath $x 360 $chipW $chipH 26
  $g.FillPath($chipBrush, $path)
  $g.DrawString($c, $fontChip, $chipBrush2,
    (New-Object System.Drawing.RectangleF($x, 360, $chipW, $chipH)), $sf)
  $path.Dispose(); $i++
}

# 底部标语
$g.DrawString('报到 · 军训 · 选课 · 生活 · 防骗 —— 一页读懂你的开学季',
  $fontFoot, $chipBrush2, (New-Object System.Drawing.RectangleF(0, 470, 1200, 50)), $sf)

$bmp.Save((Join-Path $root 'share.png'), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host 'share.png -> 1200x630 OK'

# 清理 share 用资源
$grad.Dispose(); $brushTitle.Dispose(); $chipBrush.Dispose(); $chipBrush2.Dispose(); $sf.Dispose()
$g.Dispose(); $bmp.Dispose()

# ---------- 2) App 图标 (红底 + 贸 + UIBE) ----------
function New-AppIcon([int]$size, [string]$outPath) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::Transparent)

  $pad = [int]($size * 0.06)
  $path = New-RoundPath $pad $pad ($size - 2 * $pad) ($size - 2 * $pad) ($size * 0.22)
  $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(0, 0, $size, $size)), $red, $red2, 45)
  $g.FillPath($grad, $path)

  $fontSize = [int]($size * 0.46)
  $fontMao = New-Object System.Drawing.Font('Microsoft YaHei', $fontSize, [System.Drawing.FontStyle]::Bold)
  $fontEn  = New-Object System.Drawing.Font('Microsoft YaHei', [int]($size * 0.075), [System.Drawing.FontStyle]::Bold)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $brush = New-Object System.Drawing.SolidBrush $white

  $r1 = [System.Drawing.RectangleF]::new([single]0, [single]($size * 0.08), [single]$size, [single]($size * 0.6))
  $r2 = [System.Drawing.RectangleF]::new([single]0, [single]($size * 0.66), [single]$size, [single]($size * 0.18))
  $g.DrawString('贸', $fontMao, $brush, $r1, $sf)
  $g.DrawString('UIBE 2026', $fontEn, $brush, $r2, $sf)

  $path.Dispose(); $grad.Dispose(); $sf.Dispose(); $brush.Dispose()
  $fontMao.Dispose(); $fontEn.Dispose(); $g.Dispose()
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "$outPath OK"
}

New-AppIcon 180 (Join-Path $assetsDir 'icon-180.png')
New-AppIcon 192 (Join-Path $assetsDir 'icon-192.png')
New-AppIcon 512 (Join-Path $assetsDir 'icon-512.png')

$fontTitle.Dispose(); $fontSub.Dispose(); $fontChip.Dispose(); $fontFoot.Dispose()
Write-Host 'Done.'
