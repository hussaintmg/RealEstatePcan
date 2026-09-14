import { SystemConfig, IAiProviderConfig } from '../../models/SystemConfig';
import { AiConversationMemory, IConversationMessage } from '../../models/AiConversationMemory';
import { connectToDatabase } from '../db';

export interface AiGenerateOptions {
  sessionId: string;
  userId?: string;
  prompt: string;
  systemInstruction?: string;
}

export interface AiGenerateResult {
  text: string;
  providerUsed: string;
  failoverLogs: string[];
}

async function callGemini(provider: IAiProviderConfig, prompt: string, history: IConversationMessage[], systemInstruction?: string): Promise<string> {
  const model = provider.modelName || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;

  const contents = [
    ...(systemInstruction ? [{ role: 'user', parts: [{ text: `System Instruction: ${systemInstruction}` }] }] : []),
    ...history.map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
    { role: 'user', parts: [{ text: prompt }] },
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini Error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) throw new Error('No candidate returned from Gemini');
  return candidate;
}

async function callOpenAiCompatible(
  provider: IAiProviderConfig,
  prompt: string,
  history: IConversationMessage[],
  systemInstruction?: string
): Promise<string> {
  const baseUrl =
    provider.type === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : provider.type === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : provider.baseUrl || 'https://api.openai.com/v1/chat/completions';

  const messages = [
    ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: prompt },
  ];

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.modelName || (provider.type === 'groq' ? 'llama-3.1-70b-versatile' : 'gpt-4o-mini'),
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.name} Error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message?.content;
  if (!choice) throw new Error(`No choices returned from ${provider.name}`);
  return choice;
}

export async function executeAiWithFailover(options: AiGenerateOptions): Promise<AiGenerateResult> {
  await connectToDatabase();
  const config = await SystemConfig.findOne().lean();

  if (!config?.features?.aiAssistant) {
    throw new Error('AI Assistant is currently disabled in Developer Settings.');
  }

  // Load session memory
  let memory = await AiConversationMemory.findOne({ sessionId: options.sessionId });
  if (!memory) {
    memory = await AiConversationMemory.create({
      sessionId: options.sessionId,
      userId: options.userId,
      messages: [],
    });
  }

  const activeProviders = (config.aiProviders || [])
    .filter((p) => p.isEnabled)
    .sort((a, b) => a.priority - b.priority);

  if (activeProviders.length === 0) {
    throw new Error('No active AI providers configured in Developer Settings.');
  }

  const failoverLogs: string[] = [];
  let successfulResponse: string | null = null;
  let successfulProvider: string | null = null;

  // Recent history (last 15 messages for sliding window)
  const recentHistory = memory.messages.slice(-15);

  for (const provider of activeProviders) {
    try {
      if (provider.type === 'gemini') {
        successfulResponse = await callGemini(
          provider,
          options.prompt,
          recentHistory,
          options.systemInstruction
        );
      } else {
        successfulResponse = await callOpenAiCompatible(
          provider,
          options.prompt,
          recentHistory,
          options.systemInstruction
        );
      }
      successfulProvider = provider.name;
      break; // Success! Break out of fallback loop
    } catch (err: any) {
      failoverLogs.push(`Provider [${provider.name}] failed: ${err.message || err}`);
    }
  }

  if (!successfulResponse || !successfulProvider) {
    throw new Error(`All AI Providers in fallback chain failed:\n${failoverLogs.join('\n')}`);
  }

  // Append new turns to conversation memory
  memory.messages.push({
    role: 'user',
    content: options.prompt,
    timestamp: new Date(),
  });
  memory.messages.push({
    role: 'assistant',
    content: successfulResponse,
    providerUsed: successfulProvider,
    timestamp: new Date(),
  });

  // Keep memory trimmed to sliding window of 25 messages
  if (memory.messages.length > 25) {
    memory.messages = memory.messages.slice(-25);
  }

  await memory.save();

  return {
    text: successfulResponse,
    providerUsed: successfulProvider,
    failoverLogs,
  };
}
