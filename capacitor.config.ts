import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.pneuoma.app',
    appName: 'PNEUOMA',
    webDir: 'www',
    server: {
        allowNavigation: [
            'pneuoma-server.onrender.com',
        ],
    },
    ios: {
        scheme: 'PNEUOMA',
        contentInset: 'automatic',
        preferredContentMode: 'mobile',
    },
    plugins: {},
};

export default config;
