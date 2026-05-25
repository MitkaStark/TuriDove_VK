export const SITE_CONFIG = {
  name: 'TuriDove',
  kicker: 'VIAJES',
  description: 'Viajes boutique con destinos únicos',
  url: 'https://turidove.com',
  email: 'contacto@turidove.com',
  social: {
    facebook: '#',
    instagram: '#',
    twitter: '#',
    youtube: '#',
  },
  legal: {
    about: '#',
    terms: '#',
    privacy: '#',
    contact: '#contacto',
  },
  destinations: [
    { name: 'París', label: 'Capital', slug: 'paris', city: 'Paris' },
    { name: 'Roma', label: 'Histórica', slug: 'roma', city: 'Roma' },
    { name: 'Tokio', label: 'Asia', slug: 'tokio', city: 'Tokio' },
    { name: 'Nueva York', label: 'Urbana', slug: 'nueva-york', city: 'Nueva York' },
    { name: 'Santorini', label: 'Isla', slug: 'santorini', city: 'Santorini' },
    { name: 'Marrakech', label: 'Boutique', slug: 'marrakech', city: 'Marrakech' },
  ],
  footerDestinations: ['París', 'Roma', 'Tokio', 'Nueva York'],
} as const;

export type Destination = (typeof SITE_CONFIG.destinations)[number];
