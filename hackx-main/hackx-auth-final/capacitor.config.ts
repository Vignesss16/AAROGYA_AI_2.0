import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aarogya.ai',
  appName: 'Aarogya AI',
  webDir: 'public',
  server: {
    url: 'https://arogya-ai-seven.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
