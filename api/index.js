const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const swaggerUi = require('swagger-ui-express');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini Client
// We check for GEMINI_API_KEY environment variable. 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Swagger Documentation Object
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Lead Scoring API",
    version: "1.0.0",
    description: "API to score incoming leads for Northern Coast Beverages based on conversation transcripts."
  },
  servers: [
    { url: "/" }
  ],
  paths: {
    "/api/score": {
      post: {
        summary: "Score a lead based on a conversation",
        description: "Accepts a JSON payload with a conversation transcript and returns a scored routing decision.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  lead_id: { type: "string", example: "L001" },
                  channel: { type: "string", example: "whatsapp" },
                  conversation: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string", example: "lead" },
                        text: { type: "string", example: "Hi, looking for wholesale Monster Energy..." }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful evaluation",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    lead_id: { type: "string", example: "L001" },
                    score: { type: "integer", example: 78 },
                    tier: { type: "string", example: "Warm" },
                    routing: { type: "string", example: "kam_handoff" },
                    reasoning: { type: "string", example: "Licensed importer, moderate volume..." }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad Request"
          },
          "500": {
            description: "Internal Server Error"
          }
        }
      }
    }
  }
};

// Mount Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Scoring Endpoint
app.post('/api/score', async (req, res) => {
  try {
    const { lead_id, channel, conversation } = req.body;

    if (!lead_id || !conversation || !Array.isArray(conversation)) {
      return res.status(400).json({ error: "Invalid payload. Missing lead_id or conversation array." });
    }

    // Format conversation for the prompt
    const conversationText = conversation.map(msg => `${msg.role.toUpperCase()}: ${msg.text}`).join('\n');

    const prompt = `
You are a Lead Scoring Agent for Northern Coast Beverages, a B2B beverage distributor (Coca-Cola, Monster, Red Bull, etc.).
Your job is to read an inbound lead's conversation transcript and evaluate their quality.
Our typical orders are container-load ($30K-$100K).

Evaluate based on:
1. Import License (licensed is better)
2. Product Fit (looking for our brands)
3. Volume (target is >= 1 FCL/month)
4. Real-business signals (established history, retail accounts, clear intent)

Output MUST be a valid JSON object matching this schema EXACTLY:
{
  "lead_id": "${lead_id}",
  "score": <integer between 0 and 100>,
  "tier": <"Hot" | "Warm" | "Cold">,
  "routing": <"kam_handoff" | "nurture_pool" | "auto_archive">,
  "reasoning": <"1-2 sentence rationale for your score and routing">
}

Routing Intuition:
- Hot (score > 80) -> ready for a KAM call -> "kam_handoff"
- Warm (score 50-80) -> needs nurture -> "nurture_pool"
- Cold (score < 50) -> low value / retail buyer -> "auto_archive"

Conversation Transcript:
${conversationText}

Provide only the raw JSON output without any markdown blocks or backticks.
`;

    // Call Gemini Model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    // Parse Response
    let rawText = response.text;
    
    // Kadang Gemini masih nge-return markdown backticks (```json ... ```) 
    // atau ada text tambahan, jadi kita bersihin dulu ngambil { ... } nya aja.
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawText = jsonMatch[0];
    }
    
    const jsonResult = JSON.parse(rawText);

    return res.status(200).json(jsonResult);
    
  } catch (error) {
    console.error("Error during scoring:", error);
    return res.status(500).json({ 
      error: "Failed to score lead.",
      details: error.message 
    });
  }
});

// Basic Healthcheck
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Northern Coast Lead Scoring API is running. Visit /api-docs for documentation.' });
});

// For local testing
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
  });
}

module.exports = app;
