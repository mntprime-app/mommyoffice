// ─── Site-wide defaults (safe to import anywhere — no server-only code) ───────

export const SETTING_DEFAULTS: Record<string, string> = {
  article_font_size:    '16',
  article_text_align:   'justify',
  // Footer settings — editable from /admin/footer
  footer_facebook_url:  'https://www.facebook.com/MommyofficeMN',
  footer_instagram_url: 'https://www.instagram.com/mommyoffice_mo/',
  footer_youtube_url:   '',
  footer_tiktok_url:    '',
  footer_contact_email: 'info.mommyoffice@gmail.com',
  footer_tagline:       'Монголын эмэгтэйчүүдийн №1 платформ',
  // Advertise page — editable from /admin/advertise
  advertise_contact_email: 'info.mommyoffice@gmail.com',
  advertise_contact_phone: '',
  advertise_hero_headline: 'Монголын шийдвэр гаргагч эмэгтэйчүүдийн №1 платформд брэндээ байршуул',
  advertise_hero_subtitle: '25–44 насны өрхийн худалдан авалтыг шийддэг эмэгтэйчүүдэд чиглэсэн эерэг орчинд брэндийн мессежийг хүргэнэ үү.',
  advertise_gold_price: '₮900,000',
  advertise_premium_price: '₮1,800,000',
  advertise_platinum_price: '₮2,800,000',
  // Footer nav columns — stored as JSON arrays, editable from /admin/footer
  footer_links_platform: JSON.stringify([
    { label: 'Хичээлүүд',     href: '/courses' },
    { label: 'Нийтлэлүүд',    href: '/articles' },
    { label: 'Видео & Кино',  href: '/videos' },
    { label: 'Дэлгүүр',       href: '/shop' },
  ]),
  footer_links_company: JSON.stringify([
    { label: 'Бидний тухай',              href: '/about' },
    { label: 'Холбоо барих',             href: '/contact' },
    { label: 'Багш болох',               href: '/become-instructor' },
    { label: 'Сурталчилгаа байршуулах', href: '/advertise' },
    { label: 'Нууцлалын бодлого',        href: '/privacy' },
    { label: 'Үйлчилгээний нөхцөл',     href: '/terms' },
  ]),
};
