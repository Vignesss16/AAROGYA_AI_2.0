import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { audioBase64 } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({ error: "Missing audioBase64" }, { status: 400 });
    }

    // Extract the raw base64 string from data URL
    const base64Data = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
    const buffer = Buffer.from(base64Data, "base64");
    
    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: "audio/webm" });

    // Prepare FormData for Groq API
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "json");

    // Call Groq Whisper API
    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!groqRes.ok) {
      const text = await groqRes.text();
      console.error("Groq Whisper error:", text);
      return NextResponse.json({ error: "Failed to transcribe audio" }, { status: groqRes.status });
    }

    const data = await groqRes.json();
    
    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
