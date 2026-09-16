import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MommyOffice',
    short_name: 'MommyOffice',
    description: 'Монголын эмэгтэйчүүдэд зориулсан №1 онлайн сургалтын платформ',
    start_url: '/mn',
    display: 'standalone',
    background_color: '#0d1117',
    theme_color: '#00B5AD',
    icons: [
      { src: '/squarelogo.png', sizes: '192x192', type: 'image/png' },
      { src: '/squarelogo.png', sizes: '512x512', type: 'image/png' },
    ],
    lang: 'mn',
    categories: ['education', 'lifestyle'],
  };
}
