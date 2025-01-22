import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __VITE_PASSWORD__: JSON.stringify(process.env.VITE_PASSWORD),
    __VITE_AWS_ACCESSKEY_ID__: JSON.stringify(process.env.VITE_AWS_ACCESSKEY_ID),
    __VITE_AWS_SECRET_ACCESSKEY__: JSON.stringify(process.env.VITE_AWS_SECRET_ACCESSKEY)
  }
})
