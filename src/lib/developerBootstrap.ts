import { User } from '../models/User';
import { SystemConfig } from '../models/SystemConfig';
import { hashPassword } from './auth';

export async function ensureDeveloperBootstrap() {
  // Check if SystemConfig exists
  let config = await SystemConfig.findOne();
  if (!config) {
    config = await SystemConfig.create({
      features: {
        globalSearch: true,
        aiAssistant: true,
        customerPortal: true,
        playcanvas3d: true,
        scrollVideoFrames: true,
        cms: true,
        templateEditors: true,
        themeToggle: true,
        realtimeAuditLogs: true,
      },
      storageProvider: 'supabase',
      supabaseConfig: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        bucket: 'real-estate-assets',
      },
      aiProviders: [
        {
          id: 'gemini-primary',
          name: 'Google Gemini 2.0 Flash',
          type: 'gemini',
          apiKey: process.env.GEMINI_API_KEY || '',
          modelName: 'gemini-2.0-flash',
          priority: 1,
          isEnabled: true,
        },
        {
          id: 'openai-backup',
          name: 'OpenAI GPT-4o-mini',
          type: 'openai',
          apiKey: process.env.OPENAI_API_KEY || '',
          modelName: 'gpt-4o-mini',
          priority: 2,
          isEnabled: true,
        },
        {
          id: 'groq-llama',
          name: 'Groq LLaMA 3.1 70B',
          type: 'groq',
          apiKey: process.env.GROQ_API_KEY || '',
          modelName: 'llama-3.1-70b-versatile',
          priority: 3,
          isEnabled: true,
        },
        {
          id: 'custom-api',
          name: 'Custom Enterprise LLM Endpoint',
          type: 'custom',
          apiKey: '',
          baseUrl: 'https://api.custom-ai.local/v1/chat',
          modelName: 'custom-model',
          priority: 4,
          isEnabled: false,
        },
      ],
    });
  }

  // Check if Developer user exists
  const existingDev = await User.findOne({ isDeveloper: true });
  if (!existingDev) {
    const passwordHash = await hashPassword('DeveloperMaster2026!');
    await User.create({
      fullName: 'Master Developer',
      email: 'developer@system.local',
      passwordHash,
      phone: '+1000000000',
      isDeveloper: true,
      isOwner: false,
      isActive: true,
    });
  }

  // Seed CMS Default Theme, Layouts, and Pages
  try {
    const { ensureCmsSeeded } = await import('./cms/seedCmsDefaults');
    await ensureCmsSeeded();
  } catch (err) {
    console.warn('CMS seeding warning:', err);
  }

  return config;
}
