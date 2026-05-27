import type { MetadataRoute } from 'next'
import { APP_NAME, APP_SHORT } from '@/lib/app-config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_SHORT,
    description: 'World Cup 2026 prediction pool',
    start_url: '/',
    display: 'standalone',
    background_color: '#06091a',
    theme_color: '#003087',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
