# PowerShell Script to build the final AarogyaAI Hackathon Presentation

$ogPath = "C:\Users\vigne\Downloads\Grey-MatterX_AarogyaAI.pptx"
$tgtPath = "C:\Users\vigne\Downloads\Grey-MatterX_AarogyaAI_Submission.pptx"
$tplPath = "C:\Users\vigne\Downloads\PPT_TEMPLATE_CODEAMBLE.pptx"

# Copy template to target
Copy-Item -Path $tplPath -Destination $tgtPath -Force
Write-Host "Copied template to $tgtPath"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

# Helper function to recursively search and replace text in shapes
function Replace-TextInShape($shape, $target, $replacement) {
    if ($shape.HasTextFrame -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
        if ($shape.TextFrame.HasText -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
            $textRange = $shape.TextFrame.TextRange
            if ($textRange.Text -like "*$target*") {
                $null = $textRange.Replace($target, $replacement)
                Write-Host "  Replaced '$target' in shape '$($shape.Name)'"
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
                    $null = $cellTextRange.Replace($target, $replacement)
                    Write-Host "  Replaced '$target' in table cell ($r,$c)"
                }
            }
        }
    }
    
    # Check if shape is a group
    if ($shape.Type -eq 6) {
        for ($k = 1; $k -le $shape.GroupItems.Count; $k++) {
            Replace-TextInShape $shape.GroupItems.Item($k) $target $replacement
        }
    }
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
    
    # Text replacements
    foreach ($shape in $slide1.Shapes) {
        Replace-TextInShape $shape "ZEN CLUB PRESENTS" "TEAM: GREY-MATTERX"
        Replace-TextInShape $shape "CODEAMBLE 2026" "AAROGYA AI"
        Replace-TextInShape $shape "National Level Hackathon" "Smart Healthcare Guidance for Underserved Communities"
        Replace-TextInShape $shape "Idea Submission PPT Template" "Accessible AI for Rural Outreach"
        Replace-TextInShape $shape "Fill in every slide with your team's project details" "Team Members: Ajay Mudliyar, Tanishq Mudaliyar, Atharva, Vignesh Valluvan"
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
        $logoShape.Copy()
        $pasted = $slide1.Shapes.Paste().Item(1)
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
        Replace-TextInShape $shape "[Enter your team name]" "GREY-MATTERX"
        Replace-TextInShape $shape "ZEN-TXX" "ZEN-T53"
        Replace-TextInShape $shape "[Your college / institution]" "State Engineering College"
        Replace-TextInShape $shape "2 â€“ 4 members" "4 members"
        Replace-TextInShape $shape "[Your project title]" "AarogyaAI"
        
        # Highlight Healthcare domain
        if ($shape.HasTextFrame -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
            if ($shape.TextFrame.HasText -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
                $tr = $shape.TextFrame.TextRange
                if ($tr.Text -like "*Healthcare & MedTech*") {
                    $tr.Text = "ðŸ‘‰ â¤ï¸ Healthcare & MedTech (SELECTED)"
                    $tr.Font.Bold = $true
                    $tr.Font.Size = 24
                    $tr.Font.Color.RGB = 0x0078D7 # Royal Blue
                }
                # Dim other domains
                elseif ($tr.Text -like "*Agentic & Generative*" -or $tr.Text -like "*Fintech & Cyber*" -or $tr.Text -like "*Agritech & Open*" -or $tr.Text -like "*Smart & Mobility*" -or $tr.Text -like "*Blockchain & Web3*") {
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
    
    # Text replacements
    foreach ($shape in $slide3.Shapes) {
        Replace-TextInShape $shape "Describe the real-world problem you are solving" "Rural healthcare in India faces severe challenges: doctor shortages, long travel delays for basic treatments, and inefficient paper-based records. In remote villages, low internet connectivity makes standard health apps unusable, causing delayed diagnostics and critical wage loss for rural workers."
        Replace-TextInShape $shape "How big is the problem? Mention cities" "Over 173 villages rely on a single hospital operating at under 50% capacity (11 of 23 doctor posts filled). This creates a massive rural access gap, causing long queues and dangerous delays in critical care."
        Replace-TextInShape $shape "Identify your target user group" "Rural patients in remote areas lacking local doctors, ASHA workers struggling with manual data entry, and daily wage earners/farmers who lose critical income traveling for hospital consultations."
        Replace-TextInShape $shape "Explain why existing solutions fail" "Existing telemedicine apps require high-speed internet, digital literacy, and continuous connectivity, lacking offline databases, local language translation, or low-tech voice channels."
    }
    
    # Rearrange top card to make space
    foreach ($shape in $slide3.Shapes) {
        if ($shape.Top -ge 150 -and $shape.Top -lt 330) {
            $shape.Width = 750
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
        $villagePhoto.Copy()
        $pasted = $slide3.Shapes.Paste().Item(1)
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
    
    # Text replacements
    foreach ($shape in $slide4.Shapes) {
        Replace-TextInShape $shape "Briefly describe your proposed solution" "AarogyaAI is an offline-first, full-stack AI healthcare system that bridges the rural access gap. It features an installable Progressive Web App (PWA) for ASHA workers to log patient data offline, a hybrid AI triage engine (RED, YELLOW, GREEN status), a real-time Hospital Command Center, and an automated voice agent for keypad phone users."
        Replace-TextInShape $shape "Core Feature 1" "Offline PWA & Local Sync"
        Replace-TextInShape $shape "Describe the main technical feature or capability" "ASHA workers use an installable PWA with local Dexie.js (IndexedDB) database. They log patient vitals, symptoms, and download beautifully formatted Medical Report PDFs completely offline with zero internet."
        Replace-TextInShape $shape "Core Feature 2" "Hybrid AI Triage & Voice"
        Replace-TextInShape $shape "How does your solution work? Mention the underlying" "Triage classifies patients into severity levels. In low connectivity, a local rule engine triages patients; online, it routes to a Claude-powered API. A key-phone voice agent books appointments and logs emergency SOS alerts."
        Replace-TextInShape $shape "Core Feature 3" "Hospital Command Center"
        Replace-TextInShape $shape "Describe the user experience. Is it a Web App" "A real-time Next.js doctor dashboard shows the patient queue. Pusher-powered alerts blink red for emergency cases and auto-scroll to the patient. Video consultations use WebRTC with public TURN servers to bypass strict 4G/5G NAT walls."
    }
    
    # Rearrange top card to make space
    foreach ($shape in $slide4.Shapes) {
        if ($shape.Top -ge 150 -and $shape.Top -lt 330) {
            $shape.Width = 750
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
        $scr1.Copy()
        $p1 = $slide4.Shapes.Paste().Item(1)
        $p1.Left = 840
        $p1.Top = 50
        $p1.Height = 280
        $p1.Width = 130
        
        # Paste screen 2
        $scr2.Copy()
        $p2 = $slide4.Shapes.Paste().Item(1)
        $p2.Left = 1010
        $p2.Top = 50
        $p2.Height = 280
        $p2.Width = 127
        
        # Paste screen 3
        $scr3.Copy()
        $p3 = $slide4.Shapes.Paste().Item(1)
        $p3.Left = 1180
        $p3.Top = 50
        $p3.Height = 280
        $p3.Width = 133
        
        Write-Host "  Pasted 3 phone screenshots from OG Slide 4"
    }

    # =========================================================================
    # SLIDE 5: Innovation & Differentiators
    # =========================================================================
    Write-Host "Processing Slide 5..."
    $slide5 = $tgtPres.Slides.Item(5)
    foreach ($shape in $slide5.Shapes) {
        Replace-TextInShape $shape "What makes your solution unique" "AarogyaAI introduces unique technical innovations tailored for the realities of rural infrastructure, ensuring continuous healthcare delivery regardless of connectivity:"
        Replace-TextInShape $shape "Differentiator 1:  [Explain your unique approach]" "Offline-First Syncing: Seamless database synchronization to MongoDB Atlas when network reconnects, using local IndexedDB caching for zero data loss."
        Replace-TextInShape $shape "Differentiator 2:  [Highlight a novel technology use]" "Interactive Maps & TURN Server: Leaflet maps show pharmacy stocks, and WebRTC uses public TURN servers (OpenRelay) to bypass mobile NAT blocks during video calls."
        Replace-TextInShape $shape "Differentiator 3:  [Mention cost, speed, or accessibility advantages]" "Low-Tech Voice Integration: Keypad phone users can call an Omnidimension AI voice agent, which checks doctor availability in real-time, triages symptoms, and books slots."
        
        # Table replacements
        Replace-TextInShape $shape "[Core Feature 1]" "Offline-First & PWA"
        Replace-TextInShape $shape "[Affordability]" "Low Setup Cost"
        Replace-TextInShape $shape "[Ease of Use]" "Emoji-Based UI"
        Replace-TextInShape $shape "[Scalability]" "Real-Time SOS Queue"
    }

    # =========================================================================
    # SLIDE 6: Impact & Benefits
    # =========================================================================
    Write-Host "Processing Slide 6..."
    $slide6 = $tgtPres.Slides.Item(6)
    
    # Text replacements
    foreach ($shape in $slide6.Shapes) {
        Replace-TextInShape $shape "Who benefits globally or locally? What is the measurable impact" "AarogyaAI directly addresses UN SDG 3 (Good Health & Well-being) and SDG 9 (Industry, Innovation & Infrastructure). Deployed public healthcare networks can eliminate paper delays, optimize doctor capacity, and ensure rural patients receive life-saving triage decisions within seconds."
        Replace-TextInShape $shape "Who will primarily use this product" "ASHA workers, rural community members, government doctors, local pharmacists, and district health administrators."
        Replace-TextInShape $shape "How many people or regions will this affect" "Targeting pilot deployment across 173 villages in the Nabha region, with the potential to scale to state-wide rural health networks."
        Replace-TextInShape $shape "What are the cost savings or revenue opportunities" "Reduces patient travel costs and income loss for daily wage workers, while optimizing government resource allocation."
        Replace-TextInShape $shape "How are lives improved? Tie to SDG goals" "Drastically lowers preventable deaths by flagging emergencies instantly and providing local-language medical advice."
    }
    
    # Shrink top card
    foreach ($shape in $slide6.Shapes) {
        if ($shape.Top -ge 150 -and $shape.Top -lt 330) {
            $shape.Width = 750
        }
    }
    
    # Shift bottom cards to the left
    foreach ($shape in $slide6.Shapes) {
        if ($shape.Top -gt 300 -and $shape.Top -lt 720) {
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
        $mapShape.Copy()
        $p1 = $slide6.Shapes.Paste().Item(1)
        $p1.Left = 820
        $p1.Top = 157
        $p1.Width = 580
        $p1.Height = 310
    }
    if ($pathShape) {
        $pathShape.Copy()
        $p2 = $slide6.Shapes.Paste().Item(1)
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
    
    # Text replacements
    foreach ($shape in $slide7.Shapes) {
        Replace-TextInShape $shape "Research existing solutions, competitors" "Market validation was performed through field interviews with three core stakeholders (ASHA worker, rural doctor, and health admin) to identify gaps in existing public healthcare infrastructure:"
        Replace-TextInShape $shape "Competitor 2: [Name + Key Features]" "â†’ Existing Government Apps: Lacks offline database caching, causing ASHA workers to lose patient data if the network drops between villages."
        Replace-TextInShape $shape "Competitor 3: [Name + Key Features]" "â†’ Private Telemedicine: Requires high-speed internet and continuous connectivity, rendering them unusable in rural signal deadzones."
    }
    
    # Replace top description text shape with Competitor 1!
    foreach ($shape in $slide7.Shapes) {
        if ($shape.HasTextFrame -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
            if ($shape.TextFrame.HasText -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
                $tr = $shape.TextFrame.TextRange
                if ($tr.Text -like "*Research existing solutions*") {
                    $tr.Text = "â†’ Traditional Telemedicine: Requires scheduled appointments, high bandwidth, and lacks automated triage or low-tech voice channels."
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
        $feedbackTable.Copy()
        $pTable = $slide7.Shapes.Paste().Item(1)
        $pTable.Left = 650
        $pTable.Top = 180
        $pTable.Width = 750
        $pTable.Height = 500
        Write-Host "  Pasted stakeholder validation table from OG Slide 9"
    }

    # =========================================================================
    # SLIDE 8: Gap Analysis
    # =========================================================================
    Write-Host "Processing Slide 8..."
    $slide8 = $tgtPres.Slides.Item(8)
    
    # Find table shape on Slide 8 and modify it
    $gapTableShape = $null
    foreach ($shape in $slide8.Shapes) {
        if ($shape.HasTable -eq [Microsoft.Office.Core.MsoTriState]::msoTrue) {
            $gapTableShape = $shape
            break
        }
    }
    
    if ($gapTableShape) {
        $table = $gapTableShape.Table
        
        # Add third column
        $null = $table.Columns.Add()
        
        # Adjust column widths
        $table.Columns.Item(1).Width = 180 # Parameter
        $table.Columns.Item(2).Width = 240 # Existing Solutions
        $table.Columns.Item(3).Width = 240 # Our Solution
        
        # Modify Row 1 (Headers)
        $table.Cell(1, 1).Shape.TextFrame.TextRange.Text = "Key Parameter"
        $table.Cell(1, 2).Shape.TextFrame.TextRange.Text = "Traditional Rural Healthcare"
        $table.Cell(1, 3).Shape.TextFrame.TextRange.Text = "AarogyaAI (Our Solution)"
        
        # Modify Row 2
        $table.Cell(2, 1).Shape.TextFrame.TextRange.Text = "Network Reliability"
        $table.Cell(2, 2).Shape.TextFrame.TextRange.Text = "Fails completely in zero-connectivity areas (no offline mode)."
        $table.Cell(2, 3).Shape.TextFrame.TextRange.Text = "Offline-First indexing (Dexie.js) ensures 100% functionality and zero data loss offline."
        
        # Modify Row 3
        $table.Cell(3, 1).Shape.TextFrame.TextRange.Text = "User Accessibility"
        $table.Cell(3, 2).Shape.TextFrame.TextRange.Text = "Complex English interfaces, excluding illiterate or elderly patients."
        $table.Cell(3, 3).Shape.TextFrame.TextRange.Text = "Emoji-based triage and phone-call voice agent with local Hindi & English support."
        
        # Modify Row 4
        $table.Cell(4, 1).Shape.TextFrame.TextRange.Text = "Emergency Response"
        $table.Cell(4, 2).Shape.TextFrame.TextRange.Text = "Manual dispatch and paper records, causing critical delays in treatment."
        $table.Cell(4, 3).Shape.TextFrame.TextRange.Text = "Real-time Pusher-powered command center with blinking RED critical alerts."
        
        Write-Host "  Updated and expanded Gap Analysis table on Slide 8"
    }
    
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
        $archDiagram.Copy()
        $pArch = $slide8.Shapes.Paste().Item(1)
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
