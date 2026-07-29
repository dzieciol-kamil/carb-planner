/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/carbfueling/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
