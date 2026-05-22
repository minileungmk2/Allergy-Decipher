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

    const promptText = `Analyze this food product label, packaging image, ingredients list, or barcode image.
Your focus is to extract product details to help with food allergy tracking.
Follow these extreme accuracy instructions:

1. BARCODE EXTRACTION (CRITICAL FOR USER CAPTURES):
- If there is a barcode in the image, locate the printed numeric digits directly underneath, next to, or inside the vertical barcode stripes (e.g., numbers like '5 063445 793970 >' as shown on packages).
- You MUST transcribe these exact digits carefully into "detectedBarcode". Format it as a clean, continuous numeric string with NO spaces, NO dashes, NO parentheses, and ignore any terminal symbol like '>' or '<' (for example: output '5063445793970').
- If there is absolutely no barcode, or the numbers are completely unreadable, you may leave "detectedBarcode" as an empty string or null, but look for any brand/name to set in "detectedTextSearch".

2. INGREDIENTS LIST & ALLERGENS EXTRACTION (CRITICAL FOR INGREDIENTS CHECKS & RE-SCANS):
- Locate the main INGREDIENTS section (often labeled 'INGREDIENTS' or 'Zutaten', etc.) on the packaging label (as in typical product ingredient panels).
- Translate any foreign ingredients text entirely into natural, clear English.
- Populate "ingredientsText" with the full verbose text of the ingredients.
- Parse individual ingredients into a clean array in "ingredientsList", converted to lowercase and trimmed of extra markers (like percentage numbers or brackets e.g. 'sugar', 'crisped rice', 'soya lecithins').
- List typical allergen groups present inside "allergens" (e.g. 'gluten', 'dairy', 'wheat', 'soy', 'peanuts', 'tree nuts', 'eggs', 'sesame', 'mustard', 'celery').

3. LANGUAGE TRANSLATION:
- If any text in the image is in a foreign language (such as German, French, Spanish, Chinese, Japanese, Italian, etc.), you MUST translate everything (Product name, brand, ingredients, allergens) into natural, clean English.

4. DYNAMIC SUCCESS:
- "success" MUST be true if you successfully extracted either: the barcode digits, the product name/brand, OR the ingredients list list. Set success to true even if no barcode was detected, as long as you read ingredients/names successfully from the image (e.g. during an ingredient re-scan).`;

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
