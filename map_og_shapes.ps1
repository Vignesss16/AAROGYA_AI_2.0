$pptPath = "C:\Users\vigne\Downloads\Grey-MatterX_AarogyaAI.pptx"
$logPath = "d:\MajorPRoject\ArogyaAi\og_shapes_map.txt"
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

$log = [System.Collections.Generic.List[string]]::new()

function Map-Shape($shape, $slideNum, $depth) {
    $indent = "  " * $depth
    $stype = $shape.Type
    $sname = $shape.Name
    $left = $shape.Left
    $top = $shape.Top
    $width = $shape.Width
    $height = $shape.Height
    
    $hasPicFill = $false
    try {
        if ($shape.Fill.Type -eq 6) {
            $hasPicFill = $true
        }
    } catch {}
    
    $text = ""
    if ($shape.HasTextFrame -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
        if ($shape.TextFrame.HasText -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
            $text = $shape.TextFrame.TextRange.Text.Replace("`n", " ").Replace("`r", "").Trim()
        }
    }
    
    $msg = "$($indent)Shape Name='$($sname)' Type=$($stype) PicFill=$($hasPicFill) L=$($left) T=$($top) W=$($width) H=$($height)"
    if ($text -ne "") {
        $msg += " Text='$text'"
    }
    $log.Add($msg)
    
    if ($stype -eq 6) {
        for ($k = 1; $k -le $shape.GroupItems.Count; $k++) {
            Map-Shape $shape.GroupItems.Item($k) $slideNum ($depth + 1)
        }
    }
}

try {
    $pres = $ppt.Presentations.Open($pptPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    $log.Add("Opened OG: $pptPath")
    $log.Add("======================================")
    
    for ($i = 1; $i -le $pres.Slides.Count; $i++) {
        $slide = $pres.Slides.Item($i)
        $log.Add("Slide $($i) - Name: $($slide.Name)")
        for ($j = 1; $j -le $slide.Shapes.Count; $j++) {
            Map-Shape $slide.Shapes.Item($j) $i 1
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
Write-Host "Mapped shapes saved to $logPath"
