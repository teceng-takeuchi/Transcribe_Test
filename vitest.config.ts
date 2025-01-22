import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const viteConfig = defineViteConfig({
    plugins: [react()],
});

const vitestConfig = defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        watch: false,
    },
})

export default mergeConfig(viteConfig, vitestConfig);