$pptPath = "C:\Users\vigne\Downloads\PPT_TEMPLATE_CODEAMBLE.pptx"
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

function Inspect-Shape($shape, $depth) {
    $indent = "  " * $depth
    $stype = $shape.Type
    $sname = $shape.Name
    
    $text = ""
    if ($shape.HasTextFrame -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
        if ($shape.TextFrame.HasText -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
            $text = $shape.TextFrame.TextRange.Text.Replace("`n", " ").Replace("`r", "").Trim()
        }
    }
    
    if ($text -ne "") {
        Write-Host "$($indent)Shape Name='$($sname)' Type=$($stype) Text='$text'"
    }
    
    # If it is a group shape (Type 6 is msoGroup)
    if ($stype -eq 6) {
        for ($k = 1; $k -le $shape.GroupItems.Count; $k++) {
            Inspect-Shape $shape.GroupItems.Item($k) ($depth + 1)
        }
    }
}

try {
    $pres = $ppt.Presentations.Open($pptPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    Write-Host "Opened presentation: $pptPath"
    Write-Host "Total slides: $($pres.Slides.Count)"
    Write-Host "======================================"
    
    for ($i = 1; $i -le $pres.Slides.Count; $i++) {
        $slide = $pres.Slides.Item($i)
        Write-Host "Slide $($i) - Name: $($slide.Name)"
        for ($j = 1; $j -le $slide.Shapes.Count; $j++) {
            Inspect-Shape $slide.Shapes.Item($j) 1
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
