$pptPath = "C:\Users\vigne\Downloads\PPT_TEMPLATE_CODEAMBLE.pptx"
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

try {
    $pres = $ppt.Presentations.Open($pptPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    Write-Host "Slide Width: $($pres.PageSetup.SlideWidth)"
    Write-Host "Slide Height: $($pres.PageSetup.SlideHeight)"
    $pres.Close()
} catch {
    Write-Error $_.Exception.Message
} finally {
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
