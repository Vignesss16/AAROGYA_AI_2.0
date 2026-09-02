$pptPath = "C:\Users\vigne\Downloads\Grey-MatterX_AarogyaAI.pptx"
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

try {
    $pres = $ppt.Presentations.Open($pptPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    Write-Host "Opened OG presentation: $pptPath"
    Write-Host "Total slides: $($pres.Slides.Count)"
    Write-Host "======================================"
    
    for ($i = 1; $i -le $pres.Slides.Count; $i++) {
        $slide = $pres.Slides.Item($i)
        Write-Host "Slide $($i) - Shapes Count: $($slide.Shapes.Count)"
        
        for ($j = 1; $j -le $slide.Shapes.Count; $j++) {
            $shape = $slide.Shapes.Item($j)
            $stype = $shape.Type
            $sname = $shape.Name
            
            # Print if it's a picture (Type 13) or Group (Type 6) or Table (Type 19)
            if ($stype -eq 13 -or $stype -eq 6 -or $stype -eq 19) {
                Write-Host "  Shape $($j) Name='$($sname)' Type=$($stype)"
            }
        }
        Write-Host "======================================"
    }
    $pres.Close()
} catch {
    Write-Error $_.Exception.Message
} finally {
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
