import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const base64Data = image.split(",")[1];

    const prompt = `Analyze this emergency situation image and respond in this exact format without any asterisks or bullet points:
TITLE: Write a clear, brief title
TYPE: Choose one (Theft, Kidnapping, Armed Robbery, Assault / Violence, Fire Outbreak, Natural Disaster, Drug / Cult Activity, or Other)
DESCRIPTION: Write a clear, concise description`;

    // ✅ Correct structure for GoogleGenAI
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    // ✅ Extract model output safely
    const text = response.text || "";

    console.log('text', text)

    // ✅ Parse model response
    const titleMatch = text.match(/TITLE:\s*(.+)/);
    const typeMatch = text.match(/TYPE:\s*(.+)/);
    const descMatch = text.match(/DESCRIPTION:\s*(.+)/);

    return NextResponse.json({
      title: titleMatch?.[1]?.trim() || "",
      reportType: typeMatch?.[1]?.trim() || "",
      description: descMatch?.[1]?.trim() || "",
    });
  } catch (error: any) {
    console.error("Image analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze image" },
      { status: 500 }
    );
  }
}
