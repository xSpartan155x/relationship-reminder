import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// electron-app/ (root of this sub-project)
export const APP_ROOT = path.join(__dirname, '..')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(APP_ROOT, 'dist')
export const PRELOAD_PATH = path.join(MAIN_DIST, 'preload.js')
export const INDEX_HTML = path.join(RENDERER_DIST, 'index.html')
