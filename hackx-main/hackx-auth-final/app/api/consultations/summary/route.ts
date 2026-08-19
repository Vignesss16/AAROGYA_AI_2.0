export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get("audio") as Blob;
    const roomId = formData.get("roomId") as string;

    if (!audioBlob || !roomId) {
      return NextResponse.json({ error: "Missing audio or roomId" }, { status: 400 });
    }

    // 1. Transcribe audio using Groq Whisper
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) throw new Error("GROQ_API_KEY is not set");

    const whisperFormData = new FormData();
    whisperFormData.append("file", audioBlob, "consultation.webm");
    whisperFormData.append("model", "whisper-large-v3-turbo");
    whisperFormData.append("response_format", "json");

    const transcribeRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: whisperFormData as any, // TypeScript workaround for native fetch FormData
    });

    if (!transcribeRes.ok) {
      const err = await transcribeRes.text();
      throw new Error(`Groq Whisper error: ${transcribeRes.status} ${err}`);
    }

    const transcribeData = await transcribeRes.json();
    const transcript = transcribeData.text;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ message: "No speech detected" }, { status: 200 });
    }

    // 2. Summarize using Groq LLaMA
    const summaryRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are a medical assistant summarizing a doctor's spoken notes after a consultation. Provide a concise, clear summary in 1-2 sentences. Focus on the diagnosis and key advice given. IMPORTANT: ALWAYS write the summary in English, even if the transcript is in Hindi or another language.",
          },
          { role: "user", content: transcript },
        ],
        temperature: 0.1,
      }),
    });

    if (!summaryRes.ok) {
      const err = await summaryRes.text();
      throw new Error(`Groq LLaMA error: ${summaryRes.status} ${err}`);
    }

    const summaryData = await summaryRes.json();
    const summary = summaryData.choices[0]?.message?.content?.trim() || "No summary generated";

    // 3. Append to Google Sheets
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !sheetId) {
      console.warn("Google Sheets credentials are not set in .env. Skipping sheet append.");
      return NextResponse.json({ transcript, summary, savedToSheets: false });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    // Extract patient info from roomId (e.g. "consultation-12345")
    const patientId = roomId.replace("consultation-", "");
    const date = new Date().toLocaleDateString("en-IN");
    const time = new Date().toLocaleTimeString("en-IN");

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:D", // Assumes columns: Date, Time, Patient ID, Summary
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[date, time, patientId, summary]],
      },
    });

    return NextResponse.json({ transcript, summary, savedToSheets: true });

  } catch (error) {
    console.error("Consultation summary error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
