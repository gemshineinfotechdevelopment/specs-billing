import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const aiRouter = Router();

aiRouter.post('/assistant', async (req: Request, res: Response) => {
  try {
    const { prompt, customerRx, faceShape, usage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!prompt && !customerRx && !faceShape) {
      return res.status(400).json({
        success: false,
        message: 'Prompt or customer optical parameters are required',
      });
    }

    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are an expert optometrist and optical dispensing consultant for LuminaOptic POS & Eyewear Store.
Provide concise, accurate dispensing recommendations covering frame shape compatibility, lens material/coatings (e.g. 1.67 High-Index, Crizal Anti-glare, Blue Block 420nm, Photochromic), and eye care tips in a polite retail tone.`;

        const userContent = `Customer query: ${prompt || 'Frame and lens recommendation'}\n` +
          `Prescription: ${customerRx ? JSON.stringify(customerRx) : 'Not provided'}\n` +
          `Face Shape: ${faceShape || 'Unspecified'}\n` +
          `Primary Usage: ${usage || 'Daily general wear'}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userContent,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        });

        return res.json({
          success: true,
          source: 'gemini',
          recommendation: response.text,
        });
      } catch (geminiErr) {
        console.warn('⚠️ Gemini API call failed, using built-in optical engine:', (geminiErr as Error).message);
      }
    }

    // Built-in intelligent optical dispensing knowledge engine fallback
    let advice = 'Optical Recommendation:\n';
    if (usage?.toLowerCase().includes('screen') || usage?.toLowerCase().includes('computer')) {
      advice += '• Lens: Zero-Power or Anti-Glare Blue-Cut 420nm filter lenses to reduce digital visual fatigue and circadian disruption.\n';
      advice += '• Frame: Lightweight TR90 matte frame with ergonomic silicone bridge pads for long 8+ hour comfort.\n';
    } else if (usage?.toLowerCase().includes('driving')) {
      advice += '• Lens: HD Polarized tinted lenses or Drivewear photochromic transitions with anti-reflective back-surface coat.\n';
      advice += '• Frame: Aviator or Navigator double-bridge frame with wide peripheral view.\n';
    } else {
      advice += '• Lens: Single Vision Anti-Glare with hydrophobic and oleophobic easy-clean coating.\n';
      advice += '• Frame: Classic Wayfarer or Round P3 handcrafted acetate frame.\n';
    }

    if (faceShape?.toLowerCase().includes('round')) {
      advice += '• Frame Style: Rectangular or angular geometric frames add definition and visually lengthen rounder facial contours.\n';
    } else if (faceShape?.toLowerCase().includes('square')) {
      advice += '• Frame Style: Round or oval curved frames balance strong jawlines and angular features.\n';
    }

    if (customerRx) {
      advice += '• Dispensing Note: Ensure accurate Pupillary Distance (PD) measurement before lens edging.\n';
    }

    return res.json({
      success: true,
      source: 'optical-engine-fallback',
      recommendation: advice,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

