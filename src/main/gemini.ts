// Auto-load GEMINI_API_KEY from src/.env if not set in environment
if (!process.env.GEMINI_API_KEY) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envFile = path.join(process.cwd(), 'src', '.env');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8');
      for (const line of content.split(/\r?\n/)) {
        if (line.startsWith('GEMINI_API_KEY=')) {
          const val = line.split('=')[1]?.trim();
          if (val) process.env.GEMINI_API_KEY = val;
          break;
        }
      }
    }
  } catch {
    // silent
  }
}

const MODEL = 'gemini-2.5-pro';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Auto-load GEMINI_API_KEY from src/.env if not already set
if (!process.env.GEMINI_API_KEY) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envFile = path.join(process.cwd(), 'src', '.env');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8');
      for (const line of content.split(/\r?\n/)) {
        if (line.startsWith('GEMINI_API_KEY=')) {
          const val = line.split('=')[1]?.trim();
          if (val) process.env.GEMINI_API_KEY = val;
          break;
        }
      }
    }
  } catch {
    /* silent */
  }
}

export async function analyzeComponents(dataUrl: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { error: 'GEMINI_API_KEY not set (env or src/.env)' };
  }

  const base64 = dataUrl.split(',')[1] || '';

  // Concise instruction; schema + responseMimeType enforces JSON
  const prompt =
    'Extract electronic/prototyping components visible (breadboard, resistors, jumper wires, ICs, Arduino, sensors, modules). If quantity uncertain use null. Output only JSON per schema.';

  try {
    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/png',
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            components: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  count: { type: 'INTEGER', nullable: true },
                },
                required: ['name', 'count'],
              },
            },
          },
          required: ['components'],
        },
      },
    };

    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const raw = await res.json();

    // Primary parse path (JSON enforced)
    let parsed: any;
    const firstPartText = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (firstPartText) {
      try {
        parsed = JSON.parse(firstPartText);
      } catch {
        // fall back
      }
    }

    // Fallback: attempt to stitch text parts then parse
    if (!parsed) {
      const text =
        raw?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || '')
          .join('\n') || '';
      try {
        parsed = JSON.parse(text);
      } catch {
        // Last resort: regex extraction
        const match = text.match(/\{[\s\S]*\}$/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {
            /* ignore */
          }
        }
      }
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.components)
    ) {
      // Normalize counts (allow null)
      parsed.components = parsed.components.map((c: any) => ({
        name: String(c.name || '').trim(),
        count:
          c.count === null || c.count === undefined
            ? null
            : Number.isFinite(Number(c.count))
              ? Number(c.count)
              : null,
      }));
      return parsed;
    }

    return {
      error: 'Structured JSON not received',
      components: [],
      raw: raw,
    };
  } catch (e: any) {
    return { error: e?.message || 'Gemini request failed', components: [] };
  }
}
