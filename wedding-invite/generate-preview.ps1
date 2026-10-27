# Run on Windows with: powershell -File .\wedding-invite\generate-preview.ps1
# Keep the text below in sync with index.html when changing invitation details.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$image = [System.Drawing.Bitmap]::new(1200, 630)
$graphics = [System.Drawing.Graphics]::FromImage($image)
$resources = [System.Collections.Generic.List[System.IDisposable]]::new()
try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#faf6ed'))
    $gold = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#a18348'), 1.5)
    $burgundy = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#641f32'))
    $muted = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#716358'))
    $goldBrush = [System.Drawing.SolidBrush]::new($gold.Color)
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    foreach ($resource in @($gold, $burgundy, $muted, $goldBrush, $format)) { $resources.Add($resource) }
    $graphics.DrawRectangle($gold, 23, 23, 1154, 584)
    $graphics.DrawRectangle($gold, 32, 32, 1136, 566)

    foreach ($mirrored in @($false, $true)) {
        $state = $graphics.Save()
        if ($mirrored) {
            $graphics.TranslateTransform(1200, 630)
            $graphics.RotateTransform(180)
        }
        $graphics.DrawBezier($gold, 51, 262, 137, 190, 63, 128, 191, 55)
        for ($i = 0; $i -lt 7; $i++) {
            $x = [single](66 + $i * 13)
            $y = [single](233 - $i * 24)
            $graphics.DrawBezier($gold, $x, $y, ($x - 35), ($y - 4), ($x - 36), ($y - 30), ($x - 28), ($y - 39))
            $graphics.DrawBezier($gold, $x, $y, ($x - 4), ($y - 22), ($x - 18), ($y - 32), ($x - 28), ($y - 39))
            $graphics.DrawBezier($gold, ($x + 3), ($y - 10), ($x + 34), ($y - 5), ($x + 49), ($y - 24), ($x + 47), ($y - 36))
            $graphics.DrawBezier($gold, ($x + 3), ($y - 10), ($x + 8), ($y - 28), ($x + 28), ($y - 37), ($x + 47), ($y - 36))
        }
        $graphics.Restore($state)
    }

    function Write-CenteredText {
        param([string]$Text, [string]$Family, [single]$Size, [single]$Y,
            [System.Drawing.Brush]$Brush, [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular)
        $font = [System.Drawing.Font]::new($Family, $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
        try {
            $graphics.DrawString($Text, $font, $Brush, [System.Drawing.RectangleF]::new(170, $Y, 860, 64), $format)
        } finally { $font.Dispose() }
    }

    Write-CenteredText 'TOGETHER WITH OUR FAMILIES' 'Arial' 14 62 $burgundy
    Write-CenteredText 'The wedding celebration of' 'Georgia' 21 112 $muted Italic
    Write-CenteredText 'Sai Prasen & Thanusha' 'Georgia' 65 193 $burgundy
    $graphics.DrawLine($gold, 442, 301, 563, 301)
    $graphics.DrawLine($gold, 637, 301, 758, 301)
    $diamond = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(600, 289),
        [System.Drawing.PointF]::new(622, 301),
        [System.Drawing.PointF]::new(600, 313),
        [System.Drawing.PointF]::new(578, 301)
    )
    $graphics.DrawPolygon($gold, $diamond)
    Write-CenteredText '15 NOVEMBER 2026  |  9:14 PM' 'Georgia' 27 329 $burgundy
    Write-CenteredText 'Reception: 18 November 2026  |  7 PM onwards' 'Georgia' 23 389 $muted
    Write-CenteredText 'Join us as we begin our forever.' 'Georgia' 22 468 $burgundy Italic
    Write-CenteredText 'VENUE DETAILS TO FOLLOW' 'Arial' 12 517 $muted
    $image.Save((Join-Path $PSScriptRoot 'preview.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    foreach ($resource in $resources) { $resource.Dispose() }
    $graphics.Dispose()
    $image.Dispose()
}
