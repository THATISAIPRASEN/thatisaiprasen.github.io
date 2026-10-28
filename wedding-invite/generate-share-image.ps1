# Run on Windows with: powershell -File .\wedding-invite\generate-share-image.ps1
# Keep the original invitation intact; extend its sides with softly mirrored edge colors.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$resources = [System.Collections.Generic.List[System.IDisposable]]::new()
try {
    $source = [System.Drawing.Bitmap]::new((Join-Path $PSScriptRoot 'invite.jpeg'))
    $resources.Add($source)
    $padding = 200
    $image = [System.Drawing.Bitmap]::new($source.Width + 2 * $padding, $source.Height)
    $resources.Add($image)
    $graphics = [System.Drawing.Graphics]::FromImage($image)
    $resources.Add($graphics)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#a58a61'))
    $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
    $resources.Add($attributes)
    $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)

    foreach ($side in @('left', 'right')) {
        $edge = [System.Drawing.Bitmap]::new(8, 80)
        $resources.Add($edge)
        $edgeGraphics = [System.Drawing.Graphics]::FromImage($edge)
        try {
            $edgeGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $stripWidth = [Math]::Min(120, $source.Width)
            $sourceX = if ($side -eq 'left') { 0 } else { $source.Width - $stripWidth }
            $edgeGraphics.DrawImage($source, [System.Drawing.Rectangle]::new(0, 0, 8, 80),
                $sourceX, 0, $stripWidth, $source.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
        } finally {
            $edgeGraphics.Dispose()
        }
        $edge.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)
        $targetX = if ($side -eq 'left') { 0 } else { $padding + $source.Width }
        $graphics.DrawImage($edge, [System.Drawing.Rectangle]::new($targetX, 0, $padding, $source.Height),
            0, 0, $edge.Width, $edge.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
    }
    $graphics.DrawImageUnscaled($source, $padding, 0)
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
        Where-Object { $_.MimeType -eq 'image/jpeg' }
    $parameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
    $resources.Add($parameters)
    $parameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
        [System.Drawing.Imaging.Encoder]::Quality, [long]95)
    $output = Join-Path $PSScriptRoot 'invite-share.jpeg'
    $image.Save($output, $codec, $parameters)
    Write-Output "Created $output ($($image.Width) x $($image.Height), $padding pixels of padding on each side)."
} finally {
    for ($index = $resources.Count - 1; $index -ge 0; $index--) {
        $resources[$index].Dispose()
    }
}
