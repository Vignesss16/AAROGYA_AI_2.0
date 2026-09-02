$pptPath = "C:\Users\vigne\Downloads\Grey-MatterX_AarogyaAI.pptx"
$outDir = "C:\Users\vigne\.gemini\antigravity-ide\brain\fbb2fe74-8565-4996-86a6-c29134eef3f6\og_pictures"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

function Export-Shape($shape, $slideNum, $prefix) {
    $stype = $shape.Type
    $sname = $shape.Name.Replace(" ", "_")
    
    $hasPicFill = $false
    try {
        if ($shape.Fill.Type -eq 6) {
            $hasPicFill = $true
        }
    } catch {}
    
    if ($stype -eq 13 -or $hasPicFill) {
        $imgPath = Join-Path $outDir "${prefix}slide_${slideNum}_shape_${sname}.png"
        try {
            $shape.Export($imgPath, 2) # ppShapeFormatPNG = 2
            Write-Host "Exported: $imgPath"
        } catch {
            Write-Host "Failed to export: $sname ($_.Exception.Message)"
        }
    }
}

try {
    $pres = $ppt.Presentations.Open($pptPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    
    for ($i = 1; $i -le $pres.Slides.Count; $i++) {
        $slide = $pres.Slides.Item($i)
        
        for ($j = 1; $j -le $slide.Shapes.Count; $j++) {
            $shape = $slide.Shapes.Item($j)
            Export-Shape $shape $i ""
            
            if ($shape.Type -eq 6) { # Group shape
                for ($k = 1; $k -le $shape.GroupItems.Count; $k++) {
                    Export-Shape $shape.GroupItems.Item($k) $i "grp_${j}_"
                }
            }
        }
    }
    $pres.Close()
} catch {
    Write-Error $_.Exception.Message
} finally {
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
