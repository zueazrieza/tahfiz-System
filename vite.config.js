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
        target: 'es2020',
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // React core — rarely changes, cached aggressively
                    if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
                        return 'vendor-react';
                    }
                    if (id.includes('/node_modules/react-router')) {
                        return 'vendor-router';
                    }
                    // Charting — heavy, load only when dashboards need it
                    if (id.includes('/node_modules/recharts/')) {
                        return 'vendor-charts';
                    }
                    // PDF — only used in report export
                    if (id.includes('/node_modules/jspdf/')) {
                        return 'vendor-pdf';
                    }
                    // Canvas — only used in report export
                    if (id.includes('/node_modules/html2canvas-pro/') ||
                        id.includes('/node_modules/html2canvas/')) {
                        return 'vendor-canvas';
                    }
                    // Lucide icons — large, shared across all dashboards
                    if (id.includes('/node_modules/lucide-react/')) {
                        return 'vendor-icons';
                    }
                    // Axios
                    if (id.includes('/node_modules/axios/')) {
                        return 'vendor-http';
                    }
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
