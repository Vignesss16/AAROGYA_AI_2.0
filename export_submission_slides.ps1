$pptPath = "C:\Users\vigne\Downloads\Grey-MatterX_AarogyaAI_Submission.pptx"
$outDir = "C:\Users\vigne\.gemini\antigravity-ide\brain\fbb2fe74-8565-4996-86a6-c29134eef3f6\submission_slides"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

try {
    $pres = $ppt.Presentations.Open($pptPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    
    for ($i = 1; $i -le $pres.Slides.Count; $i++) {
        $slide = $pres.Slides.Item($i)
        $imgPath = Join-Path $outDir "slide_$($i).jpg"
        $slide.Export($imgPath, "JPG")
        Write-Host "Exported Slide $($i) to $imgPath"
    }
    
    $pres.Close()
} catch {
    Write-Error $_.Exception.Message
} finally {
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
