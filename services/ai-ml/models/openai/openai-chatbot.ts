import type { AnalysisRunData } from '../../../../assets/types';
import { callOpenAI } from './openai-core';

const chatbotResponseSchema = {
  type: 'object' as const,
  properties: {
    responseText: { type: 'string' as const },
    candidateIds: { type: 'array' as const, items: { type: 'string' as const } },
  },
  required: ['responseText', 'candidateIds'],
};

export const getChatbotAdvice = async (
  analysisData: AnalysisRunData,
  userInput: string
): Promise<{ responseText: string; candidateIds: string[] }> => {
  const successfulCandidates = analysisData.candidates.filter(c => c.status === 'SUCCESS');

  const sanitizedCandidates = successfulCandidates.map(c => ({
    id: c.id,
    name: c.candidateName,
    rank: c.analysis?.['Hạng'],
    totalScore: c.analysis?.['Tổng điểm'],
    jdFitPercent: c.analysis?.['Chi tiết']?.find(item => item['Tiêu chí'].startsWith('Phù hợp JD'))
      ? parseInt(c.analysis['Chi tiết'].find(item => item['Tiêu chí'].startsWith('Phù hợp JD'))!['Điểm'].split('/')[0], 10)
      : 0,
    title: c.jobTitle,
    level: c.experienceLevel,
  }));

  const summary = {
    total: successfulCandidates.length,
    countA: successfulCandidates.filter(c => c.analysis?.['Hạng'] === 'A').length,
    countB: successfulCandidates.filter(c => c.analysis?.['Hạng'] === 'B').length,
    countC: successfulCandidates.filter(c => c.analysis?.['Hạng'] === 'C').length,
  };

  const prompt = `You are a helpful AI recruitment assistant. Language: Vietnamese.
**CONTEXT:**
- Job Position: ${analysisData.job.position}
- Location: ${analysisData.job.locationRequirement}
- Summary: ${JSON.stringify(summary)}
- Candidates: ${JSON.stringify(sanitizedCandidates.slice(0, 20))}
**USER QUERY:** "${userInput}"
**TASKS:**
1. Analyze and respond in Vietnamese.
2. If asking for suggestions/filtering, include candidate 'id' values in candidateIds array.
3. For salary questions: mention Salary Analysis feature, provide general ranges (Junior: 8-15tr, Mid: 15-30tr, Senior: 30-60tr, Lead: 60-100tr VND/month).
**OUTPUT JSON: { "responseText": "string", "candidateIds": ["id1", "id2"] }`;

  try {
    const response = await callOpenAI(prompt, {
      responseSchema: chatbotResponseSchema,
      temperature: 0,
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error getting OpenAI chatbot advice:', error);
    throw new Error('OpenAI chatbot is currently unavailable.');
  }
};
