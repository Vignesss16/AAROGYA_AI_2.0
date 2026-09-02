# PowerShell Script to build the final AarogyaAI Hackathon Presentation (ASCII Safe, Clipboard Robust & Layout Clean Edition)

$ogPath = "C:\Users\vigne\Downloads\Grey-MatterX_AarogyaAI.pptx"
$tgtPath = "C:\Users\vigne\Downloads\Grey-MatterX_AarogyaAI_Submission.pptx"
$tplPath = "C:\Users\vigne\Downloads\PPT_TEMPLATE_CODEAMBLE.pptx"

# Copy template to target
Copy-Item -Path $tplPath -Destination $tgtPath -Force
Write-Host "Copied template to $tgtPath"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

# Helper function to recursively search and replace text in shapes
function Replace-TextInShape($shape, $target, $replacement, $replaceEntire) {
    if ($shape.HasTextFrame -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
        if ($shape.TextFrame.HasText -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
            $textRange = $shape.TextFrame.TextRange
            if ($textRange.Text -like "*$target*") {
                if ($replaceEntire) {
                    $textRange.Text = $replacement
                } else {
                    $null = $textRange.Replace($target, $replacement)
                }
                
                # Make text grow downwards and apply clean margins
                $shape.TextFrame.VerticalAnchor = 1 # msoAnchorTop = 1
                $shape.TextFrame.MarginTop = 0
                $shape.TextFrame.MarginBottom = 0
                
                # Dynamically set font size for long paragraphs
                if ($replacement.Length -gt 100) {
                    $textRange.Font.Size = 13
                }
                
                Write-Host "  Replaced '$target' in shape '$($shape.Name)' (Entire=$replaceEntire)"
            }
        }
    }
    
    # Check if shape is a table
    if ($shape.HasTable -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
        $table = $shape.Table
        for ($r = 1; $r -le $table.Rows.Count; $r++) {
            for ($c = 1; $c -le $table.Columns.Count; $c++) {
                $cellTextRange = $table.Cell($r, $c).Shape.TextFrame.TextRange
                if ($cellTextRange.Text -like "*$target*") {
                    if ($replaceEntire) {
                        $cellTextRange.Text = $replacement
                    } else {
                        $null = $cellTextRange.Replace($target, $replacement)
                    }
                    Write-Host "  Replaced '$target' in table cell ($r,$c) (Entire=$replaceEntire)"
                }
            }
        }
    }
    
    # Check if shape is a group
    if ($shape.Type -eq 6) {
        for ($k = 1; $k -le $shape.GroupItems.Count; $k++) {
            Replace-TextInShape $shape.GroupItems.Item($k) $target $replacement $replaceEntire
        }
    }
}

# Helper function to copy and paste shapes robustly with retries
function Copy-PasteShape($srcShape, $destSlide) {
    $pasted = $null
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            $srcShape.Copy()
            Start-Sleep -Milliseconds 250
            $pasted = $destSlide.Shapes.Paste().Item(1)
            if ($pasted) {
                return $pasted
            }
        } catch {
            Write-Host "  Warning: Clipboard paste attempt $attempt failed. Retrying..."
            Start-Sleep -Milliseconds 300
        }
    }
    throw "Failed to copy and paste shape after 5 attempts."
}

try {
    # Open presentations
    $ogPres = $ppt.Presentations.Open($ogPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    $tgtPres = $ppt.Presentations.Open($tgtPath, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoTrue)
    Write-Host "Opened presentations successfully"

    # =========================================================================
    # SLIDE 1: Title Slide
    # =========================================================================
    Write-Host "Processing Slide 1..."
    $slide1 = $tgtPres.Slides.Item(1)
    
    # Text replacements (Replace Entire = True for cover visual cleanliness)
    foreach ($shape in $slide1.Shapes) {
        Replace-TextInShape $shape "ZEN CLUB PRESENTS" "TEAM: GREY-MATTERX" $true
        Replace-TextInShape $shape "CODEAMBLE 2026" "AAROGYA AI" $true
        Replace-TextInShape $shape "National Level Hackathon" "Smart Healthcare Guidance for Underserved Communities" $true
        Replace-TextInShape $shape "Idea Submission PPT Template" "Accessible AI for Rural Outreach" $true
        Replace-TextInShape $shape "Fill in every slide with your team's project details" "Team Members: Ajay Mudliyar, Tanishq Mudaliyar, Atharva, Vignesh Valluvan" $true
    }
    
    # Copy logo from OG Slide 1 (Group 13)
    $ogSlide1 = $ogPres.Slides.Item(1)
    $logoShape = $null
    foreach ($sh in $ogSlide1.Shapes) {
        if ($sh.Name -eq "Group 13") {
            $logoShape = $sh
            break
        }
    }
    if ($logoShape) {
        $pasted = Copy-PasteShape $logoShape $slide1
        $pasted.Left = 980
        $pasted.Top = 180
        $pasted.Width = 400
        $pasted.Height = 400
        Write-Host "  Pasted logo from OG Slide 1"
    }

    # =========================================================================
    # SLIDE 2: Team & Project Overview
    # =========================================================================
    Write-Host "Processing Slide 2..."
    $slide2 = $tgtPres.Slides.Item(2)
    foreach ($shape in $slide2.Shapes) {
        Replace-TextInShape $shape "team name" "GREY-MATTERX" $false
        Replace-TextInShape $shape "ZEN-TXX" "ZEN-T53" $false
        Replace-TextInShape $shape "college / institution" "State Engineering College" $false
        Replace-TextInShape $shape "2" "4 members" $false
        Replace-TextInShape $shape "project title" "AarogyaAI" $false
        
        # Highlight Healthcare domain
        if ($shape.HasTextFrame -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
            if ($shape.TextFrame.HasText -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
                $tr = $shape.TextFrame.TextRange
                if ($tr.Text -like "*Healthcare*") {
                    $tr.Text = "Healthcare and MedTech (SELECTED)"
                    $tr.Font.Bold = $true
                    $tr.Font.Size = 24
                    $tr.Font.Color.RGB = 0xD77800 # BGR Royal Blue
                }
                # Dim other domains
                elseif ($tr.Text -like "*Agentic*" -or $tr.Text -like "*Fintech*" -or $tr.Text -like "*Agritech*" -or $tr.Text -like "*Smart*" -or $tr.Text -like "*Blockchain*") {
                    $tr.Font.Color.RGB = 0x808080 # Grey
                }
            }
        }
    }

    # =========================================================================
    # SLIDE 3: Problem Statement
    # =========================================================================
    Write-Host "Processing Slide 3..."
    $slide3 = $tgtPres.Slides.Item(3)
    
    # Text replacements (Replace Entire = True to remove placeholder leftovers)
    foreach ($shape in $slide3.Shapes) {
        Replace-TextInShape $shape "Describe the real-world problem you are solving" "Rural healthcare in India faces severe challenges: doctor shortages, long travel delays for basic treatments, and inefficient paper-based records. In remote villages, low internet connectivity makes standard health apps unusable, causing delayed diagnostics and critical wage loss for rural workers." $true
        Replace-TextInShape $shape "How big is the problem? Mention" "Over 173 villages rely on a single hospital operating at under 50% capacity (11 of 23 doctor posts filled). This creates a massive rural access gap, causing long queues and dangerous delays in critical care." $true
        Replace-TextInShape $shape "Identify your target user group" "Rural patients in remote areas lacking local doctors, ASHA workers struggling with manual data entry, and daily wage earners/farmers who lose critical income traveling for hospital consultations." $true
        Replace-TextInShape $shape "Explain why existing solutions fail" "Existing telemedicine apps require high-speed internet, digital literacy, and continuous connectivity, lacking offline databases, local language translation, or low-tech voice channels." $true
    }
    
    # Rearrange top card to make space
    foreach ($shape in $slide3.Shapes) {
        if ($shape.Top -ge 150 -and $shape.Top -lt 330) {
            $shape.LockAspectRatio = [Microsoft.Office.Core.MsoTriState]::msoFalse
            $shape.Width = 750
            if ($shape.Name -like "*Shape;197*") {
                $shape.Height = 190
            }
        }
    }
    
    # Copy village photo from OG Slide 2 (Freeform 22)
    $ogSlide2 = $ogPres.Slides.Item(2)
    $villagePhoto = $null
    foreach ($sh in $ogSlide2.Shapes) {
        if ($sh.Name -eq "Freeform 22") {
            $villagePhoto = $sh
            break
        }
    }
    if ($villagePhoto) {
        $pasted = Copy-PasteShape $villagePhoto $slide3
        $pasted.Left = 840
        $pasted.Top = 157
        $pasted.Width = 550
        $pasted.Height = 168
        Write-Host "  Pasted village photo from OG Slide 2"
    }

    # =========================================================================
    # SLIDE 4: Proposed Solution
    # =========================================================================
    Write-Host "Processing Slide 4..."
    $slide4 = $tgtPres.Slides.Item(4)
    
    # Text replacements (Replace Entire = True to remove placeholder leftovers)
    foreach ($shape in $slide4.Shapes) {
        Replace-TextInShape $shape "Briefly describe your proposed solution" "AarogyaAI is an offline-first, full-stack AI healthcare system that bridges the rural access gap. It features an installable Progressive Web App (PWA) for ASHA workers to log patient data offline, a hybrid AI triage engine (RED, YELLOW, GREEN status), a real-time Hospital Command Center, and an automated voice agent for keypad phone users." $true
        Replace-TextInShape $shape "Core Feature 1" "Offline PWA & Local Sync" $true
        Replace-TextInShape $shape "Describe the main technical feature or capability" "ASHA workers use an installable PWA with local Dexie.js (IndexedDB) database. They log patient vitals, symptoms, and download beautifully formatted Medical Report PDFs completely offline with zero internet." $true
        Replace-TextInShape $shape "Core Feature 2" "Hybrid AI Triage & Voice" $true
        Replace-TextInShape $shape "How does your solution work? Mention the underlying" "Triage classifies patients into severity levels. In low connectivity, a local rule engine triages patients; online, it routes to a Claude-powered API. A key-phone voice agent books appointments and logs emergency SOS alerts." $true
        Replace-TextInShape $shape "Core Feature 3" "Hospital Command Center" $true
        Replace-TextInShape $shape "Describe the user experience. Is it a Web App" "A real-time Next.js doctor dashboard shows the patient queue. Pusher-powered alerts blink red for emergency cases and auto-scroll to the patient. Video consultations use WebRTC with public TURN servers to bypass strict 4G/5G NAT walls." $true
    }
    
    # Rearrange top card to make space
    foreach ($shape in $slide4.Shapes) {
        if ($shape.Top -ge 150 -and $shape.Top -lt 330) {
            $shape.LockAspectRatio = [Microsoft.Office.Core.MsoTriState]::msoFalse
            $shape.Width = 750
            if ($shape.Name -like "*Shape;260*") {
                $shape.Height = 190
            }
        }
    }
    
    # Copy screenshots from OG Slide 4 (Freeform 13, 14, 15)
    $ogSlide4 = $ogPres.Slides.Item(4)
    $scr1 = $null; $scr2 = $null; $scr3 = $null
    foreach ($sh in $ogSlide4.Shapes) {
        if ($sh.Name -eq "Freeform 13") { $scr1 = $sh }
        elseif ($sh.Name -eq "Freeform 14") { $scr2 = $sh }
        elseif ($sh.Name -eq "Freeform 15") { $scr3 = $sh }
    }
    if ($scr1 -and $scr2 -and $scr3) {
        # Paste screen 1
        $p1 = Copy-PasteShape $scr1 $slide4
        $p1.Left = 800
        $p1.Top = 160
        $p1.Height = 200
        $p1.Width = 93
        
        # Paste screen 2
        $p2 = Copy-PasteShape $scr2 $slide4
        $p2.Left = 920
        $p2.Top = 160
        $p2.Height = 200
        $p2.Width = 90
        
        # Paste screen 3
        $p3 = Copy-PasteShape $scr3 $slide4
        $p3.Left = 1040
        $p3.Top = 160
        $p3.Height = 200
        $p3.Width = 95
        
        Write-Host "  Pasted 3 phone screenshots from OG Slide 4"
    }

    # =========================================================================
    # SLIDE 5: Innovation & Differentiators
    # =========================================================================
    Write-Host "Processing Slide 5..."
    $slide5 = $tgtPres.Slides.Item(5)
    foreach ($shape in $slide5.Shapes) {
        Replace-TextInShape $shape "What makes your solution unique" "AarogyaAI introduces unique technical innovations tailored for the realities of rural infrastructure, ensuring continuous healthcare delivery regardless of connectivity:" $true
        Replace-TextInShape $shape "Differentiator 1" "Offline-First Syncing: Seamless database synchronization to MongoDB Atlas when network reconnects, using local IndexedDB caching for zero data loss." $true
        Replace-TextInShape $shape "Differentiator 2" "Interactive Maps & TURN Server: Leaflet maps show pharmacy stocks, and WebRTC uses public TURN servers (OpenRelay) to bypass mobile NAT blocks during video calls." $true
        Replace-TextInShape $shape "Differentiator 3" "Low-Tech Voice Integration: Keypad phone users can call an Omnidimension AI voice agent, which checks doctor availability in real-time, triages symptoms, and books slots." $true
        
        # Table replacements
        Replace-TextInShape $shape "Feature 1" "Offline-First and PWA" $true
        Replace-TextInShape $shape "Affordability" "Low Setup Cost" $true
        Replace-TextInShape $shape "Ease of Use" "Emoji-Based UI" $true
        Replace-TextInShape $shape "Scalability" "Real-Time SOS Queue" $true
    }

    # =========================================================================
    # SLIDE 6: Impact & Benefits
    # =========================================================================
    Write-Host "Processing Slide 6..."
    $slide6 = $tgtPres.Slides.Item(6)
    
    # Text replacements (Replace Entire = True to remove placeholder leftovers)
    foreach ($shape in $slide6.Shapes) {
        Replace-TextInShape $shape "Who benefits globally or locally" "AarogyaAI directly addresses UN SDG 3 (Good Health and Well-being) and SDG 9 (Industry, Innovation and Infrastructure). Deployed public healthcare networks can eliminate paper delays, optimize doctor capacity, and ensure rural patients receive life-saving triage decisions within seconds." $true
        Replace-TextInShape $shape "primarily use this product" "ASHA workers, rural community members, government doctors, local pharmacists, and district health administrators." $true
        Replace-TextInShape $shape "people or regions" "Targeting pilot deployment across 173 villages in the Nabha region, with the potential to scale to state-wide rural health networks." $true
        Replace-TextInShape $shape "cost savings or revenue" "Reduces patient travel costs and income loss for daily wage workers, while optimizing government resource allocation." $true
        Replace-TextInShape $shape "lives improved" "Drastically lowers preventable deaths by flagging emergencies instantly and providing local-language medical advice." $true
    }
    
    # Shrink top card
    foreach ($shape in $slide6.Shapes) {
        if ($shape.Top -ge 150 -and $shape.Top -lt 330) {
            $shape.LockAspectRatio = [Microsoft.Office.Core.MsoTriState]::msoFalse
            $shape.Width = 750
            if ($shape.Name -like "*Shape;366*") {
                $shape.Height = 190
            }
        }
    }
    
    # Shift bottom cards to the left
    foreach ($shape in $slide6.Shapes) {
        if ($shape.Top -gt 300 -and $shape.Top -lt 720) {
            $shape.LockAspectRatio = [Microsoft.Office.Core.MsoTriState]::msoFalse
            if ($shape.Left -ge 40 -and $shape.Left -le 45) {
                $shape.Width = 350
            }
            elseif ($shape.Left -ge 710 -and $shape.Left -le 720) {
                $shape.Left = 420
                $shape.Width = 350
            }
            elseif ($shape.Left -ge 70 -and $shape.Left -le 80) {
                if ($shape.Width -gt 350) {
                    $shape.Width = 300
                }
            }
            elseif ($shape.Left -ge 740 -and $shape.Left -le 760) {
                $shape.Left = $shape.Left - 298.8
                if ($shape.Width -gt 350) {
                    $shape.Width = 300
                }
            }
        }
    }
    
    # Copy India map and metrics from OG Slide 8 (Freeform 11 and Freeform 10)
    $ogSlide8 = $ogPres.Slides.Item(8)
    $mapShape = $null; $pathShape = $null
    foreach ($sh in $ogSlide8.Shapes) {
        if ($sh.Name -eq "Freeform 11") { $mapShape = $sh }
        elseif ($sh.Name -eq "Freeform 10") { $pathShape = $sh }
    }
    if ($mapShape) {
        $p1 = Copy-PasteShape $mapShape $slide6
        $p1.Left = 820
        $p1.Top = 157
        $p1.Width = 580
        $p1.Height = 310
    }
    if ($pathShape) {
        $p2 = Copy-PasteShape $pathShape $slide6
        $p2.Left = 820
        $p2.Top = 480
        $p2.Width = 580
        $p2.Height = 76
    }
    Write-Host "  Pasted India map and roadmap from OG Slide 8"

    # =========================================================================
    # SLIDE 7: Market Research
    # =========================================================================
    Write-Host "Processing Slide 7..."
    $slide7 = $tgtPres.Slides.Item(7)
    
    # Text replacements (Replace Entire = True to remove placeholder leftovers)
    foreach ($shape in $slide7.Shapes) {
        Replace-TextInShape $shape "Research existing solutions" "Market validation was performed through field interviews with three core stakeholders (ASHA worker, rural doctor, and health admin) to identify gaps in existing public healthcare infrastructure:" $true
        Replace-TextInShape $shape "Competitor 2" "→ Existing Government Apps: Lacks offline database caching, causing ASHA workers to lose patient data if the network drops between villages." $true
        Replace-TextInShape $shape "Competitor 3" "→ Private Telemedicine: Requires high-speed internet and continuous connectivity, rendering them unusable in rural signal deadzones." $true
    }
    
    # Replace top description text shape with Competitor 1!
    foreach ($shape in $slide7.Shapes) {
        if ($shape.HasTextFrame -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
            if ($shape.TextFrame.HasText -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
                $tr = $shape.TextFrame.TextRange
                if ($tr.Text -like "*Research existing solutions*") {
                    $tr.Text = "→ Traditional Telemedicine: Requires scheduled appointments, high bandwidth, and lacks automated triage or low-tech voice channels."
                }
            }
        }
    }
    
    # Copy Stakeholder Validation table from OG Slide 9 (Table 0)
    $ogSlide9 = $ogPres.Slides.Item(9)
    $feedbackTable = $null
    foreach ($sh in $ogSlide9.Shapes) {
        if ($sh.Name -eq "Table 0") {
            $feedbackTable = $sh
            break
        }
    }
    if ($feedbackTable) {
        $pTable = Copy-PasteShape $feedbackTable $slide7
        $pTable.Left = 650
        $pTable.Top = 180
        $pTable.Width = 750
        $pTable.Height = 500
        Write-Host "  Pasted stakeholder validation table from OG Slide 9"
    }

    # =========================================================================
    # SLIDE 8: Gap Analysis & System Architecture
    # =========================================================================
    Write-Host "Processing Slide 8..."
    $slide8 = $tgtPres.Slides.Item(8)
    
    # Find and delete the embedded OLE table (Type 7) on Slide 8
    foreach ($shape in $slide8.Shapes) {
        if ($shape.Type -eq 7 -or $shape.Name -like "*Shape;467*") {
            $shape.Delete()
            Write-Host "  Deleted OLE table shape on Slide 8"
        }
    }
    
    # Add native PowerPoint table on Slide 8
    $tableShape = $slide8.Shapes.AddTable(4, 3, 50, 240, 640, 420)
    $table = $tableShape.Table
    
    # Adjust column widths
    $table.Columns.Item(1).Width = 140 # Parameter
    $table.Columns.Item(2).Width = 250 # Existing Solutions
    $table.Columns.Item(3).Width = 250 # Our Solution
    
    # Populate cells
    $data = @(
        @("Key Parameter", "Traditional Rural Healthcare", "AarogyaAI (Our Solution)"),
        @("Network Reliability", "Fails completely in zero-connectivity areas (no offline mode).", "Offline-First indexing (Dexie.js) ensures 100% functionality and zero data loss offline."),
        @("User Accessibility", "Complex English interfaces, excluding illiterate or elderly patients.", "Emoji-based triage and phone-call voice agent with local Hindi and English support."),
        @("Emergency Response", "Manual dispatch and paper records, causing critical delays in treatment.", "Real-time Pusher-powered command center with blinking RED critical alerts.")
    )
    
    for ($r = 1; $r -le 4; $r++) {
        for ($c = 1; $c -le 3; $c++) {
            $cell = $table.Cell($r, $c)
            $tr = $cell.Shape.TextFrame.TextRange
            $tr.Text = $data[$r-1][$c-1]
            $tr.Font.Name = "Arial"
            $tr.Font.Size = 11
            
            # Align text to middle vertically
            $cell.Shape.TextFrame.VerticalAnchor = 3 # msoAnchorMiddle = 3
            
            if ($r -eq 1) {
                $tr.Font.Bold = $true
                $tr.Font.Color.RGB = 0xFFFFFF # White text
                $cell.Shape.Fill.Solid()
                $cell.Shape.Fill.ForeColor.RGB = 0xD77800 # BGR Royal Blue (RGB 0, 120, 215)
            } else {
                $tr.Font.Color.RGB = 0x333333 # Dark Grey text
                $cell.Shape.Fill.Solid()
                if ($r % 2 -eq 0) {
                    $cell.Shape.Fill.ForeColor.RGB = 0xF5F5F5 # Zebra light grey
                } else {
                    $cell.Shape.Fill.ForeColor.RGB = 0xFFFFFF # White
                }
            }
        }
    }
    Write-Host "  Created and styled native Gap Analysis table on Slide 8"
    
    # Copy System Architecture diagram from OG Slide 7 (Picture 24)
    $ogSlide7 = $ogPres.Slides.Item(7)
    $archDiagram = $null
    foreach ($sh in $ogSlide7.Shapes) {
        if ($sh.Name -eq "Picture 24") {
            $archDiagram = $sh
            break
        }
    }
    if ($archDiagram) {
        $pArch = Copy-PasteShape $archDiagram $slide8
        $pArch.Left = 720
        $pArch.Top = 180
        $pArch.Width = 680
        $pArch.Height = 500
        Write-Host "  Pasted architecture diagram from OG Slide 7"
    }

    # =========================================================================
    # DELETE SLIDE 9 (Instruction Slide)
    # =========================================================================
    if ($tgtPres.Slides.Count -eq 9) {
        $tgtPres.Slides.Item(9).Delete()
        Write-Host "Deleted instruction slide (Slide 9)"
    }
    
    # Save the target presentation
    $tgtPres.Save()
    Write-Host "Target presentation saved successfully"

} catch {
    Write-Error $_.Exception.Message
} finally {
    # Close presentations and quit PowerPoint
    if ($ogPres) { $ogPres.Close() }
    if ($tgtPres) { $tgtPres.Close() }
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
