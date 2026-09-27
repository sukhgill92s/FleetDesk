import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fleetdesk.app',
  appName: 'FleetDesk',
  webDir: 'public',
  // Load the live deployed web app inside the native shell.
  // This keeps Next.js SSR, middleware and Supabase auth working as-is.
  server: {
    url: 'https://fleet-desk-tau.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
