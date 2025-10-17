// Google Gemini AI integration (Direct API)
import { extractedResumeSchema, type ExtractedResumeData } from './schemas';

const GEMINI_MODEL = 'gemini-2.5-pro';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1/models';

function getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY environment variable');
    }

    return apiKey;
}

async function callGeminiAPI(prompt: string, config: {
    temperature: number;
    maxOutputTokens: number;
}): Promise<{ text: string; tokensUsed: number }> {
    const apiKey = getApiKey();
    const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: config.temperature,
                maxOutputTokens: config.maxOutputTokens,
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        throw new Error(`No candidates in response. Full response: ${JSON.stringify(data)}`);
    }

    const candidate = data.candidates[0];
    
    // Check for finish reasons that indicate incomplete responses
    if (candidate.finishReason === 'MAX_TOKENS') {
        throw new Error(`Response was cut off due to token limit. Increase maxOutputTokens in the request.`);
    }
    
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`Response incomplete. Finish reason: ${candidate.finishReason}. Candidate: ${JSON.stringify(candidate)}`);
    }
    
    if (!candidate.content) {
        throw new Error(`No content in candidate. Candidate: ${JSON.stringify(candidate)}`);
    }
    
    // Handle different response structures from Gemini models
    if (!candidate.content.parts || candidate.content.parts.length === 0) {
        // Some models might return text differently
        if (candidate.content.text) {
            return { text: candidate.content.text, tokensUsed: (data.usageMetadata?.promptTokenCount || 0) + (data.usageMetadata?.candidatesTokenCount || 0) };
        }
        throw new Error(`No parts in content. Candidate: ${JSON.stringify(candidate)}`);
    }

    const text = candidate.content.parts[0].text;
    
    if (!text) {
        throw new Error(`No text in response. Full candidate: ${JSON.stringify(candidate)}`);
    }

    const tokensUsed = (data.usageMetadata?.promptTokenCount || 0) +
                      (data.usageMetadata?.candidatesTokenCount || 0);

    return { text, tokensUsed };
}

// Extract structured data from resume text
export async function extractResumeData(resumeText: string): Promise<{
    data: ExtractedResumeData;
    tokensUsed: number;
}> {
    const prompt = `You are a resume parser. Extract structured information from the following resume text.

Return ONLY valid JSON matching this exact schema:
{
  "fullName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "currentPosition": "string or null",
  "company": "string or null",
  "yearsExperience": number or null,
  "keyAchievements": "string or null",
  "primarySkills": "string or null",
  "programmingLanguages": "string or null",
  "frameworks": "string or null"
}

If any field cannot be found, use null for that field.
For keyAchievements, extract 2-3 key accomplishments from the resume.
For primarySkills, extract the main technical skills mentioned.
For programmingLanguages, list the programming languages mentioned (comma-separated).
For frameworks, list frameworks/libraries mentioned (comma-separated).

Resume text:
${resumeText}`;

    try {
        const { text, tokensUsed } = await callGeminiAPI(prompt, {
            temperature: 0.3,
            maxOutputTokens: 8192,
        });

        // Extract JSON from response (handle markdown code blocks)
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7);
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith('```')) {
            jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();

        const parsed = JSON.parse(jsonText);
        const validated = extractedResumeSchema.parse(parsed);

        return {
            data: validated,
            tokensUsed,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to extract resume data: ${error.message}`);
        }
        throw new Error('Failed to extract resume data: Unknown error');
    }
}

// Improve text for a specific field
export async function improveText(
    text: string,
    fieldName: string
): Promise<{
    improvedText: string;
    tokensUsed: number;
}> {
    const prompt = `You are a professional career coach. Improve the following text to be more professional and compelling for a job application.

Keep the core meaning but make it more impactful. Use strong action verbs and quantify achievements where possible.
Return ONLY the improved text, no explanations or additional commentary.

Original text:
${text}

Context: This is for the "${fieldName}" field in a job application.`;

    try {
        const { text: improvedText, tokensUsed } = await callGeminiAPI(prompt, {
            temperature: 0.7,
            maxOutputTokens: 8192,
        });

        return {
            improvedText: improvedText.trim(),
            tokensUsed,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to improve text: ${error.message}`);
        }
        throw new Error('Failed to improve text: Unknown error');
    }
}

