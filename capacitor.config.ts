
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.98013796e37a42c99ffc4a3b962b9776',
  appName: 'antiNews',
  webDir: 'dist',
  server: {
    url: 'https://98013796-e37a-42c9-9ffc-4a3b962b9776.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    }
  }
};

export default config;
