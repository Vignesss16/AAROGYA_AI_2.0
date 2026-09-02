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
        Write-Host "Slide $($i) - Name: $($slide.Name)"
        
        for ($j = 1; $j -le $slide.Shapes.Count; $j++) {
            $shape = $slide.Shapes.Item($j)
            $stype = $shape.Type
            
            $hasPicFill = $false
            try {
                if ($shape.Fill.Type -eq 6) { # msoFillPicture = 6
                    $hasPicFill = $true
                }
            } catch {}
            
            if ($stype -eq 13 -or $hasPicFill) {
                Write-Host "  Shape $($j) - Name='$($shape.Name)' Type=$($stype) - Has Picture Fill: $hasPicFill"
            }
            
            # If it's a group, inspect group items
            if ($stype -eq 6) {
                for ($k = 1; $k -le $shape.GroupItems.Count; $k++) {
                    $subShape = $shape.GroupItems.Item($k)
                    $subPicFill = $false
                    try {
                        if ($subShape.Fill.Type -eq 6) {
                            $subPicFill = $true
                        }
                    } catch {}
                    
                    if ($subShape.Type -eq 13 -or $subPicFill) {
                        Write-Host "    Sub-Shape $($k) - Name='$($subShape.Name)' Type=$($subShape.Type) - Has Picture Fill: $subPicFill"
                    }
                }
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
