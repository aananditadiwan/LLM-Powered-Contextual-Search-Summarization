import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../../');

  return {
    server: {
      host: '0.0.0.0', 
      allowedHosts: [
        '*',       
      ],
    },
    plugins: [
      tailwindcss(),
      react(),
    ],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL),
    },
  };
});
