$pptPath = "C:\Users\vigne\Downloads\PPT_TEMPLATE_CODEAMBLE.pptx"
$logPath = "d:\MajorPRoject\ArogyaAi\template_text_content.txt"
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

$log = [System.Collections.Generic.List[string]]::new()

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
        $log.Add("$($indent)Shape Name='$($sname)' Type=$($stype) Text='$text'")
    }
    
    if ($stype -eq 6) {
        for ($k = 1; $k -le $shape.GroupItems.Count; $k++) {
            Inspect-Shape $shape.GroupItems.Item($k) ($depth + 1)
        }
    }
}

try {
    $pres = $ppt.Presentations.Open($pptPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    $log.Add("Opened presentation: $pptPath")
    $log.Add("Total slides: $($pres.Slides.Count)")
    $log.Add("======================================")
    
    for ($i = 1; $i -le $pres.Slides.Count; $i++) {
        $slide = $pres.Slides.Item($i)
        $log.Add("Slide $($i) - Name: $($slide.Name)")
        for ($j = 1; $j -le $slide.Shapes.Count; $j++) {
            Inspect-Shape $slide.Shapes.Item($j) 1
        }
        $log.Add("======================================")
    }
    $pres.Close()
} catch {
    $log.Add("Error: " + $_.Exception.Message)
} finally {
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}

$log | Out-File -FilePath $logPath -Force
Write-Host "Wrote template text content to $logPath"
