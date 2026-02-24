import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.pneuoma.app',
    appName: 'PNEUOMA Capture',
    webDir: 'www',
    server: {
        allowNavigation: [
            'pneuoma-server.onrender.com',
        ],
    },
    ios: {
        scheme: 'PNEUOMA',
        contentInset: 'always',
        preferredContentMode: 'mobile',
        backgroundColor: '#07080d',
    },
    plugins: {
        StatusBar: {
            style: 'LIGHT',
            overlaysWebView: true,
        },
    },
};

export default config;
