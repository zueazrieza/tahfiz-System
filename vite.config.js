import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.tsx'],
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],
    build: {
        // Target modern browsers — smaller output
        target: 'es2020',
        rollupOptions: {
            output: {
                // Split large dependencies into separate cacheable chunks
                manualChunks: {
                    // React core — rarely changes, cached aggressively
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-router': ['react-router-dom'],
                    // Charting — heavy, load only when dashboards need it
                    'vendor-charts': ['recharts'],
                    // PDF / canvas — only used in report export
                    'vendor-pdf': ['jspdf', 'html2canvas'],
                    // Lucide icons — large, shared across all dashboards
                    'vendor-icons': ['lucide-react'],
                    // Axios — tiny but separated so it's cached separately
                    'vendor-http': ['axios'],
                },
            },
        },
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
