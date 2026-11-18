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
  // Hero
  advertise_hero_headline: 'Монголын шийдвэр гаргагч эмэгтэйчүүдийн №1 платформд брэндээ байршуул',
  advertise_hero_subtitle: '25–44 насны өрхийн худалдан авалтыг шийддэг эмэгтэйчүүдэд чиглэсэн эерэг орчинд брэндийн мессежийг хүргэнэ үү.',
  advertise_hero_bg: '',            // background image URL for hero (optional)
  advertise_hero_cta: 'Сурталчилгааны санал татаж авах',
  advertise_mediakit_url: '',       // PDF download link
  advertise_hero_video_url: '',     // YouTube or direct video URL for hero right panel
  // Stats / reach section
  advertise_stats_image: '',        // banner or image URL for stats section
  advertise_stats_title: 'Манай платформын хүрэлцээ',
  // Slot card overrides — JSON array of { id, name, placement, desc, price, priceSub, image }
  advertise_slots_data: '[]',
  // Stats numbers — editable so they can grow with the platform
  advertise_stat_1_value: '88.8%',
  advertise_stat_1_label: 'Эмэгтэй үзэгч',
  advertise_stat_2_value: '31K+',
  advertise_stat_2_label: 'Нийт дагагч',
  advertise_stat_3_value: '50K+',
  advertise_stat_3_label: 'Сарын хүрэлцээ',
  // Hero secondary button
  advertise_hero_cta2: 'Асуулга илгээх',
  // Section headings
  advertise_pillars_section_title: 'Агуулгын үндсэн баганууд',
  advertise_pillars_section_desc: 'Брэндийнхаа зорилтот хэрэглэгчидтэй холбогдох 6 платформын тулгуур контент.',
  advertise_packages_section_title: 'Багцаар илүү хэмнэнэ',
  advertise_packages_section_desc: 'Reel байршуулалт зөвхөн багцад — тусдаа худалдаалагдахгүй',
  advertise_slots_section_title: 'Байршуулалтын сонголтууд',
  advertise_slots_section_desc: 'Захиалах товч дарж яг тохирох байршуулалтаа сонгоорой',
  advertise_mediakit_section_title: 'Дэлгэрэнгүй мэдээллийг татаж авна уу',
  advertise_mediakit_section_desc: 'Аудиторийн тайлан, байршуулалтын жагсаалт болон үнийн санал бүхий бүрэн медиа кит.',
  // Package overrides — JSON array of { id, name, badge, price, items: string[] }
  advertise_packages_data: '[]',
  // Why advertise section
  advertise_why_title: 'Яагаад MommyOffice-д сурталчлах вэ?',
  advertise_why_text: 'Монголын өрхийн худалдан авалтын шийдвэрийг гаргадаг 25–44 насны эмэгтэйчүүд бидний гол үзэгчид. Брэндийнхаа мессежийг зорилтот орчинд хүргэн, итгэлийн маркетингийн давуу талыг ашиглаарай.',
  // 6 Content Pillars
  advertise_pillar_1_title: 'Амжилтын эзэд',
  advertise_pillar_1_desc: 'Монголын амжилттай эмэгтэйчүүдийн түүхүүд болон ажлын туршлага.',
  advertise_pillar_1_image: '',
  advertise_pillar_2_title: 'Startup Women',
  advertise_pillar_2_desc: 'Эмэгтэй гарааны бизнес эрхлэгчдийн сан, нөөц, нийгэмлэг.',
  advertise_pillar_2_image: '',
  advertise_pillar_3_title: 'Эрүүл Мэнд',
  advertise_pillar_3_desc: 'Гэр бүлийн эрүүл мэнд, хоол тэжээл, сайн сайхны байнгын агуулга.',
  advertise_pillar_3_image: '',
  advertise_pillar_4_title: 'Mom Hacks',
  advertise_pillar_4_desc: 'Хурдан амттай хоол, цаг хугацааны менежмент, амьдралыг хялбарчлах зөвлөмж.',
  advertise_pillar_4_image: '',
  advertise_pillar_5_title: 'Дотно Харилцаа',
  advertise_pillar_5_desc: 'Хосын болон гэр бүлийн харилцааг гүнзгийрүүлэх контент.',
  advertise_pillar_5_image: '',
  advertise_pillar_6_title: 'Ээжүүдийн Хобби',
  advertise_pillar_6_desc: 'Урлаг, гар урлал, хобби болон хувийн хөгжлийн илэрхийлэл.',
  advertise_pillar_6_image: '',
  // Packages
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
