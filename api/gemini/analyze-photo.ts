import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build-vercel',
    }
  }
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    let mimeType = "image/png";
    let base64Data = "";

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        base64Data = image;
      }
    } else {
      base64Data = image;
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      }
    };

    const promptText = `Analyze this product package or ingredients list label image.
Extract as many fields as possible to help with food allergy tracking.
Focus heavily on accuracy.
CRITICAL: If the label or any texts in the image are in a language other than English (for example: German, French, Spanish, Chinese, Japanese, Italian, etc.), you MUST automatically translate everything (including the product "name", "brand", verbatim "ingredientsText", "ingredientsList" items, and "allergens") into accurate, natural English.
If you can read any numeric barcode digits printed on the package (usually located underneath vertical lines, typically 8, 12, or 13 digits), put them in "detectedBarcode".
Otherwise, if you cannot find a readable barcode but see the brand and name, put them in "detectedTextSearch".
In "productDetails", extract (always translating any foreign entries to English):
- "name": descriptive name of the food product in English (e.g. 'Gluten Free Oat Bread' or 'Cocoa Spread').
- "brand": the food brand (e.g. 'Biona' or 'Livia\'s').
- "ingredientsText": the complete, verbose text of the ingredients list exactly as written on the package label, but translated fully to English.
- "ingredientsList": a clean array of individual ingredient strings, converted to lowercase, trimmed, and translated fully to English.
- "allergens": clear list of common typical allergens detected in the ingredients, translated fully to English (e.g., ['gluten', 'dairy', 'wheat', 'soy', 'peanuts', 'tree nuts', 'eggs', 'sesame']).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        imagePart,
        { text: promptText }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedBarcode: {
              type: Type.STRING,
              description: "Numeric digits of any barcode found on the package/label, or empty/null if none found or readable."
            },
            detectedTextSearch: {
              type: Type.STRING,
              description: "An optimal text search term (brand + product name) or empty if none."
            },
            productDetails: {
              type: Type.OBJECT,
              description: "Extracted and nested food product ingredients information.",
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Name of the food product, e.g., 'Double Chocolate Chip Cookies' or 'Oat Drink Chocolate'."
                },
                brand: {
                  type: Type.STRING,
                  description: "The food's manufacturing brand, e.g., 'Oatly' or 'Livia\'s'."
                },
                ingredientsText: {
                  type: Type.STRING,
                  description: "Complete verbatim text of coordinates/listings of the ingredients list."
                },
                ingredientsList: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Flat list of individual ingredients parsed out (lowercase, trimmed)."
                },
                allergens: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Clear list of standard food allergens present, e.g., ['gluten', 'dairy', 'wheat', 'soy']."
                }
              },
              required: ["name", "brand", "ingredientsText", "ingredientsList", "allergens"]
            },
            success: {
              type: Type.BOOLEAN,
              description: "Whether the vision parsing succeeded."
            }
          },
          required: ["detectedBarcode", "detectedTextSearch", "productDetails", "success"]
        }
      }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);

    return res.json(result);

  } catch (error: any) {
    console.error("Gemini Vision Serverless Error:", error);
    return res.status(500).json({ error: "Failed to analyze image with AI", details: error.message });
  }
}
