$pptPath = "C:\Users\vigne\Downloads\PPT_TEMPLATE_CODEAMBLE.pptx"
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue # Keep it visible or hidden

try {
    $pres = $ppt.Presentations.Open($pptPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    Write-Host "Opened presentation: $pptPath"
    Write-Host "Total slides: $($pres.Slides.Count)"
    Write-Host "--------------------------------------"
    
    for ($i = 1; $i -le $pres.Slides.Count; $i++) {
        $slide = $pres.Slides.Item($i)
        $layout = $slide.Layout
        $scount = $slide.Shapes.Count
        Write-Host "Slide $($i) - Layout=$($layout) - Shapes count=$($scount)"
        
        for ($j = 1; $j -le $scount; $j++) {
            $shape = $slide.Shapes.Item($j)
            $text = ""
            if ($shape.HasTextFrame -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
                if ($shape.TextFrame.HasText -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
                    $text = $shape.TextFrame.TextRange.Text
                }
            }
            $sname = $shape.Name
            $stype = $shape.Type
            Write-Host "  Shape $($j) - Name=$($sname), Type=$($stype), Text='$text'"
        }
        Write-Host "--------------------------------------"
    }
    
    $pres.Close()
} catch {
    Write-Error $_.Exception.Message
} finally {
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
