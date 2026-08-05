import { NextResponse } from "next/server";
import { google } from "googleapis";
import dbConnect from "@/lib/mongodb";
import Patient from "@/models/Patient";

export const dynamic = 'force-dynamic'; // Prevent caching for cron jobs

// Helper function to parse "DD/MM/YYYY" from en-IN locale
function parseDateString(dateStr: string) {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date(dateStr); // Fallback
}

export async function GET(req: Request) {
  try {
    // 1. Verify cron authorization (Optional but recommended)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !sheetId) {
      return NextResponse.json({ error: "Missing Google Sheets credentials in environment" }, { status: 500 });
    }

    // 2. Fetch rows from Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A:D", // Date, Time, Patient ID, Summary
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ message: "No data found in Google Sheet." });
    }

    // Calculate the date exactly 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    // Reset hours to compare just the date
    twoDaysAgo.setHours(0, 0, 0, 0);

    await dbConnect();
    const callsInitiated = [];

    // Skip header row if exists, loop through the records
    for (let i = 0; i < rows.length; i++) {
      const [dateStr, timeStr, patientId, summary] = rows[i];
      if (!dateStr || dateStr === "Date") continue;

      const recordDate = parseDateString(dateStr);
      recordDate.setHours(0, 0, 0, 0);

      // Check if the record is exactly 2 days ago
      if (recordDate.getTime() === twoDaysAgo.getTime()) {
        
        // Find patient in DB to get their phone number and name
        // patientId from sheet might be their phone number or MongoDB _id
        const patient = await Patient.findOne({
          $or: [{ phone: patientId }, { _id: patientId }]
        }).catch(() => null); // Catch cast errors if patientId is not a valid ObjectId

        if (!patient || !patient.phone) {
          console.warn(`Patient not found or no phone number for ID: ${patientId}`);
          continue;
        }

        // 3. Trigger Omnidimension Outbound Call
        const omniPayload = {
          agent_id: "233224",
          phone_number: patient.phone,
          call_context: `You are the AarogyaAI automated follow-up assistant. You are calling our patient, ${patient.name}. 
                   Two days ago, they had a consultation and their doctor's summary was: "${summary}".
                   
                   Your Goal: Politely ask if they have been taking their prescribed medication and if their condition has improved. 
                   If they state they are feeling worse or having severe symptoms, urgently instruct them to visit the hospital or use the SOS button in the app.
                   Speak naturally, be empathetic, and keep your responses concise.`
        };

        // Note: Using a dummy/placeholder URL for Omnidimension API since the actual one varies by their platform
        const omniApiKey = process.env.OMNI_API_KEY || "";
        if (omniApiKey) {
          try {
             // Example POST request to Omnidimension Outbound API
             await fetch("https://omnidim.io/api/v1/calls/dispatch", {
               method: "POST",
               headers: { 
                 "Content-Type": "application/json",
                 "Authorization": `Bearer ${omniApiKey}` 
               },
               body: JSON.stringify(omniPayload)
             });
             callsInitiated.push({ patient: patient.name, phone: patient.phone });
          } catch (err) {
             console.error(`Failed to initiate call for ${patient.name}:`, err);
          }
        } else {
          console.warn("OMNI_API_KEY is not set. Skipping actual call dispatch.");
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Follow-up routine completed. Initiated ${callsInitiated.length} calls.`,
      calls: callsInitiated
    });

  } catch (error: any) {
    console.error("Follow-up Cron Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
