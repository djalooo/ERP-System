import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';
import path from 'node:path'; // Keep path for resolving

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(),],
  // **الإصلاح الأساسي**: تعيين `base` إلى مسار نسبي './'
  // هذا يجعل جميع المسارات في ملفات الإنتاج (JS, CSS) تبدأ بـ `./`
  // وهو أمر ضروري لتطبيقات Electron لتجنب خطأ ERR_FILE_NOT_FOUND.
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});