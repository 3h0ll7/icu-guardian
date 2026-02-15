import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an ICU monitoring AI that analyzes camera frames from an ICU room.
Analyze the image and extract ALL visible information. Respond ONLY with a JSON object using this exact schema — no markdown, no explanation:

{
  "vitals": {
    "heartRate": { "value": <number|null>, "status": "normal"|"warning"|"critical"|"unknown", "trend": "stable"|"rising"|"falling" },
    "spO2": { "value": <number|null>, "status": "normal"|"warning"|"critical"|"unknown", "trend": "stable"|"rising"|"falling" },
    "systolicBP": { "value": <number|null>, "status": "normal"|"warning"|"critical"|"unknown", "trend": "stable" },
    "diastolicBP": { "value": <number|null>, "status": "normal"|"warning"|"critical"|"unknown", "trend": "stable" },
    "respiratoryRate": { "value": <number|null>, "status": "normal"|"warning"|"critical"|"unknown", "trend": "stable" },
    "temperature": { "value": <number|null>, "status": "normal"|"warning"|"critical"|"unknown", "trend": "stable" }
  },
  "pumps": [
    {
      "id": "<string>",
      "label": "<string>",
      "medication": "<string>",
      "status": "running"|"paused"|"alarm"|"completed"|"unknown",
      "flowRate": <number|null>,
      "flowRateUnit": "mL/h",
      "volumeRemaining": <number|null>,
      "volumeTotal": <number|null>,
      "estimatedTimeRemaining": <number|null>,
      "alarmMessage": "<string|null>"
    }
  ],
  "patient": {
    "posture": "supine"|"prone"|"side"|"sitting"|"unknown",
    "activityLevel": "calm"|"restless"|"agitated"|"unknown",
    "movementDescription": "<string>",
    "riskEvents": ["<string>"]
  },
  "scene": {
    "staffPresent": <boolean>,
    "monitorVisible": <boolean>,
    "pumpsVisible": <boolean>,
    "lightingAdequate": <boolean>
  },
  "alerts": [
    { "priority": "critical"|"warning"|"info", "category": "<string>", "message": "<string>" }
  ]
}

ICU Thresholds:
- HR: critical <50 or >120, warning <60 or >100
- SpO2: critical <90, warning <94
- Systolic BP: critical <90 or >180, warning <100 or >140
- Diastolic BP: warning <60 or >90
- RR: critical <8 or >25, warning <12 or >20
- Temp: critical >39 or <35, warning >38 or <36

If you cannot see a value, set it to null with status "unknown".
If no pumps are visible, return an empty array.
Always generate alerts for any critical or warning findings.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this ICU room camera frame. Extract all visible vitals, pump data, patient status, and scene context." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI analysis", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-icu-frame error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
