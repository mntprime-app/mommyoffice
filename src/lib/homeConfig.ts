// Home page config types and defaults — NOT a server action file
// Imported by admin.ts (server) and admin/home/page.tsx (client)

export interface HomeConfig {
  hero_title_mn: string;
  hero_title_en: string;
  hero_subtitle_mn: string;
  hero_subtitle_en: string;
  hero_badge_text: string;
  hero_cover_image_url: string;
  hero_youtube_id: string;
  hero_primary_cta_text: string;
  hero_primary_cta_href: string;
  hero_secondary_cta_text: string;
  hero_secondary_cta_href: string;
  show_courses_section: boolean;
  show_articles_section: boolean;
  show_videos_section: boolean;
  show_shop_section: boolean;
  /** Shows 🔴 "Хамгийн их үзэгдсэн" badge in the detail modal */
  hero_is_popular?: boolean;
  /** e.g. "45 мин" or "3 цуврал" — shown in modal metadata row */
  hero_duration_text?: string;
  /** e.g. "2026" — shown in modal metadata row */
  hero_year?: string;
}

export const HOME_CONFIG_DEFAULTS: HomeConfig = {
  hero_title_mn: 'Монголын эмэгтэйчүүдэд зориулсан №1 платформ',
  hero_title_en: "Mongolia's #1 Women's Platform",
  hero_subtitle_mn: 'Мэдлэг эзэмш. Амьдралаа сайжруул. Мөрөөлдөө биелүүл.',
  hero_subtitle_en: 'Learn. Grow. Achieve.',
  hero_badge_text: '🇲🇳 MONGOLIA #1 PLATFORM',
  hero_cover_image_url: '',
  hero_youtube_id: '',
  hero_primary_cta_text: 'Үзэх',
  hero_primary_cta_href: '/mn/courses',
  hero_secondary_cta_text: 'Дэлгэрэнгүй',
  hero_secondary_cta_href: '/mn/articles',
  show_courses_section: true,
  show_articles_section: true,
  show_videos_section: true,
  show_shop_section: false,
};
