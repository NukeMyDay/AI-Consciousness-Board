import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { answer, concept, explanation, isFollowUp, originalAnswer, followUpQuestion } = await request.json();

	if (!answer || !concept) throw error(400, 'answer and concept required');

	let prompt: string;

	if (isFollowUp) {
		prompt = `You are evaluating a student's knowledge about: "${concept}"

Their original explanation was: "${originalAnswer}"

You asked them: "${followUpQuestion}"

Their answer: "${answer}"

Provide brief feedback (2-3 sentences) on whether they correctly addressed the follow-up. Be honest and specific.

Respond in JSON: {"feedback": "..."}`;
	} else {
		prompt = `You are evaluating a student's understanding of: "${concept}"
${explanation ? `\nExpected understanding: ${explanation}` : ''}

Their explanation: "${answer}"

Evaluate their understanding. Be honest — if they're wrong, say so. If they're partially right, note what's missing.
Then ask ONE specific follow-up question to test deeper understanding.

Respond in JSON: {"feedback": "2-3 sentences evaluating their answer", "followUp": "one specific follow-up question"}`;
	}

	try {
		let result: any;

		if (env.ANTHROPIC_API_KEY) {
			const Anthropic = (await import('@anthropic-ai/sdk')).default;
			const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
			const response = await client.messages.create({
				model: 'claude-sonnet-4-20250514',
				max_tokens: 500,
				messages: [{ role: 'user', content: prompt }]
			});
			const text = response.content[0].type === 'text' ? response.content[0].text : '';
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			result = jsonMatch ? JSON.parse(jsonMatch[0]) : { feedback: text, followUp: '' };
		} else if (env.GOOGLE_AI_API_KEY) {
			const { GoogleGenAI } = await import('@google/genai');
			const ai = new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });
			const response = await ai.models.generateContent({
				model: 'gemini-2.5-flash',
				contents: [{ role: 'user', parts: [{ text: prompt }] }],
				config: { maxOutputTokens: 500 }
			});
			const text = response.text ?? '';
			const jsonMatch = text.match(/\{[\s\S]*\}/);
			result = jsonMatch ? JSON.parse(jsonMatch[0]) : { feedback: text, followUp: '' };
		} else {
			return json({ feedback: 'No AI API key configured. Set ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY in .env to enable evaluation.', followUp: '' });
		}

		return json(result);
	} catch (e: any) {
		return json({ feedback: `Evaluation error: ${e.message}`, followUp: '' });
	}
};
