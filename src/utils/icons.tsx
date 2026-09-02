import React from 'react';
import { 
  Film, 
  Tv, 
  Video, 
  Headphones, 
  Mic, 
  Radio, 
  MessageSquare, 
  Sparkles, 
  Code, 
  Cloud, 
  Briefcase, 
  Laptop, 
  Gamepad2, 
  Gamepad, 
  GraduationCap, 
  BookOpen, 
  Dumbbell, 
  Trophy, 
  ShoppingBag, 
  Palette, 
  Newspaper, 
  Lock, 
  Key, 
  Euro, 
  Star, 
  Heart, 
  Layers, 
  LayoutGrid,
  Bot,
  Clapperboard,
  Music,
  CreditCard,
  Globe,
  Zap,
  ShieldCheck,
  Play,
  Share2,
  Bookmark,
  Coffee,
  Compass,
  Monitor,
  Smartphone,
  Flame,
  Crown,
  FileText
} from 'lucide-react';

export interface IconOption {
  key: string;
  label: string;
  category: string;
  icon: React.ElementType;
}

export interface ColorOption {
  hex: string;
  label: string;
}

export interface ServicePreset {
  key: string;
  name: string;
  category: string;
  defaultColorHex: string;
  shortLabel?: string;
  lucideIcon?: React.ElementType;
}

export const PRESET_SERVICES: ServicePreset[] = [
  { key: 'Netflix', name: 'Netflix', category: 'Streaming', defaultColorHex: '#E50914', shortLabel: 'N', lucideIcon: Film },
  { key: 'Spotify', name: 'Spotify', category: 'Música', defaultColorHex: '#1DB954', shortLabel: 'SP', lucideIcon: Headphones },
  { key: 'Disney+', name: 'Disney+', category: 'Streaming', defaultColorHex: '#113CCF', shortLabel: 'D+', lucideIcon: Sparkles },
  { key: 'YouTube', name: 'YouTube', category: 'Streaming', defaultColorHex: '#FF0000', shortLabel: 'YT', lucideIcon: Play },
  { key: 'Amazon Prime', name: 'Amazon Prime', category: 'Streaming', defaultColorHex: '#00A8E1', shortLabel: 'PR', lucideIcon: ShoppingBag },
  { key: 'ChatGPT', name: 'ChatGPT / OpenAI', category: 'Productividad', defaultColorHex: '#10A37F', shortLabel: 'GPT', lucideIcon: Bot },
  { key: 'Apple', name: 'Apple One / Music', category: 'Música', defaultColorHex: '#1E293B', shortLabel: '', lucideIcon: Music },
  { key: 'HBO Max', name: 'HBO Max / Max', category: 'Streaming', defaultColorHex: '#5A2E98', shortLabel: 'MAX', lucideIcon: Tv },
  { key: 'DAZN', name: 'DAZN', category: 'Salud', defaultColorHex: '#1E293B', shortLabel: 'DAZN', lucideIcon: Trophy },
  { key: 'Movistar+', name: 'Movistar+', category: 'Streaming', defaultColorHex: '#005C8A', shortLabel: 'M+', lucideIcon: Tv },
  { key: 'Nintendo', name: 'Nintendo Switch', category: 'Gaming', defaultColorHex: '#E60012', shortLabel: 'NSW', lucideIcon: Gamepad2 },
  { key: 'PlayStation', name: 'PlayStation Plus', category: 'Gaming', defaultColorHex: '#003791', shortLabel: 'PS', lucideIcon: Gamepad },
  { key: 'Xbox', name: 'Xbox Game Pass', category: 'Gaming', defaultColorHex: '#107C10', shortLabel: 'XB', lucideIcon: Gamepad2 },
  { key: 'Crunchyroll', name: 'Crunchyroll', category: 'Streaming', defaultColorHex: '#F47521', shortLabel: 'CR', lucideIcon: Film },
  { key: 'Twitch', name: 'Twitch', category: 'Gaming', defaultColorHex: '#9146FF', shortLabel: 'TW', lucideIcon: Video },
  { key: 'Deezer', name: 'Deezer', category: 'Música', defaultColorHex: '#A238FF', shortLabel: 'DZ', lucideIcon: Headphones },
  { key: 'Tidal', name: 'Tidal', category: 'Música', defaultColorHex: '#000000', shortLabel: 'TD', lucideIcon: Music },
  { key: 'SoundCloud', name: 'SoundCloud', category: 'Música', defaultColorHex: '#FF5500', shortLabel: 'SC', lucideIcon: Mic },
  { key: 'Duolingo', name: 'Duolingo', category: 'Educación', defaultColorHex: '#58CC02', shortLabel: 'DUO', lucideIcon: GraduationCap },
  { key: 'Notion', name: 'Notion', category: 'Productividad', defaultColorHex: '#1E293B', shortLabel: 'N', lucideIcon: BookOpen },
  { key: 'GitHub', name: 'GitHub Copilot', category: 'Productividad', defaultColorHex: '#24292F', shortLabel: 'GH', lucideIcon: Code },
  { key: 'Adobe', name: 'Adobe Creative Cloud', category: 'Productividad', defaultColorHex: '#FF0000', shortLabel: 'Ai', lucideIcon: Palette },
  { key: 'Canva', name: 'Canva Pro', category: 'Productividad', defaultColorHex: '#00C4CC', shortLabel: 'C', lucideIcon: Palette },
  { key: 'Microsoft 365', name: 'Microsoft 365', category: 'Productividad', defaultColorHex: '#D83B01', shortLabel: 'M365', lucideIcon: Laptop },
  { key: 'Google One', name: 'Google One', category: 'Productividad', defaultColorHex: '#4285F4', shortLabel: 'G1', lucideIcon: Cloud },
  { key: 'iCloud', name: 'Apple iCloud+', category: 'Productividad', defaultColorHex: '#34AADC', shortLabel: 'iCl', lucideIcon: Cloud },
  { key: 'Dropbox', name: 'Dropbox', category: 'Productividad', defaultColorHex: '#0061FF', shortLabel: 'DB', lucideIcon: Cloud },
  { key: '1Password', name: '1Password', category: 'Seguridad', defaultColorHex: '#0A85EA', shortLabel: '1P', lucideIcon: Key },
  { key: 'NordVPN', name: 'NordVPN', category: 'Seguridad', defaultColorHex: '#4687FF', shortLabel: 'VPN', lucideIcon: ShieldCheck },
  { key: 'Strava', name: 'Strava Summit', category: 'Salud', defaultColorHex: '#FC4C02', shortLabel: 'STR', lucideIcon: Trophy },
  { key: 'Gym', name: 'Gimnasio / Fitness', category: 'Salud', defaultColorHex: '#10B981', shortLabel: 'GYM', lucideIcon: Dumbbell },
  { key: 'Custom', name: 'Personalizado', category: 'General', defaultColorHex: '#1285FA', shortLabel: '★', lucideIcon: Layers },
];

export const AVAILABLE_ICON_COLORS: ColorOption[] = [
  { hex: '#6366F1', label: 'Índigo' },
  { hex: '#4F46E5', label: 'Violeta' },
  { hex: '#3B82F6', label: 'Azul' },
  { hex: '#00A8E1', label: 'Cian' },
  { hex: '#06B6D4', label: 'Turquesa' },
  { hex: '#10B981', label: 'Esmeralda' },
  { hex: '#1DB954', label: 'Verde Spotify' },
  { hex: '#22C55E', label: 'Verde' },
  { hex: '#84CC16', label: 'Lima' },
  { hex: '#EAB308', label: 'Amarillo' },
  { hex: '#F59E0B', label: 'Ámbar' },
  { hex: '#F97316', label: 'Naranja' },
  { hex: '#E50914', label: 'Rojo Netflix' },
  { hex: '#EF4444', label: 'Rojo' },
  { hex: '#EC4899', label: 'Rosa' },
  { hex: '#D946EF', label: 'Fucsia' },
  { hex: '#8B5CF6', label: 'Púrpura' },
  { hex: '#64748B', label: 'Pizarra' },
  { hex: '#1E293B', label: 'Oscuro' },
  { hex: '#000000', label: 'Negro' },
];

export const AVAILABLE_ICONS: IconOption[] = [
  { key: 'movie', label: 'Películas', category: 'Streaming', icon: Film },
  { key: 'tv', label: 'Series / TV', category: 'Streaming', icon: Tv },
  { key: 'videocam', label: 'Video', category: 'Streaming', icon: Video },
  { key: 'headphones', label: 'Música', category: 'Música', icon: Headphones },
  { key: 'mic', label: 'Podcast / Audio', category: 'Música', icon: Mic },
  { key: 'radio', label: 'Radio', category: 'Música', icon: Radio },
  { key: 'chat', label: 'Chat / IA', category: 'Productividad', icon: MessageSquare },
  { key: 'auto_awesome', label: 'IA / Gemini', category: 'Productividad', icon: Sparkles },
  { key: 'code', label: 'Desarrollo', category: 'Productividad', icon: Code },
  { key: 'cloud', label: 'Nube / Almacenamiento', category: 'Productividad', icon: Cloud },
  { key: 'work', label: 'Trabajo', category: 'Productividad', icon: Briefcase },
  { key: 'laptop', label: 'Software', category: 'Productividad', icon: Laptop },
  { key: 'games', label: 'Gaming', category: 'Gaming', icon: Gamepad2 },
  { key: 'sports_esports', label: 'Consola', category: 'Gaming', icon: Gamepad },
  { key: 'school', label: 'Educación', category: 'Educación', icon: GraduationCap },
  { key: 'book', label: 'Libros / Lectura', category: 'Educación', icon: BookOpen },
  { key: 'fitness', label: 'Gimnasio / Deporte', category: 'Salud', icon: Dumbbell },
  { key: 'soccer', label: 'Deportes', category: 'Salud', icon: Trophy },
  { key: 'shopping', label: 'Compras / Tienda', category: 'Estilo de vida', icon: ShoppingBag },
  { key: 'palette', label: 'Diseño', category: 'Estilo de vida', icon: Palette },
  { key: 'newspaper', label: 'Noticias / Prensa', category: 'Estilo de vida', icon: Newspaper },
  { key: 'lock', label: 'Seguridad / VPN', category: 'Seguridad', icon: Lock },
  { key: 'key', label: 'Contraseñas / Vault', category: 'Seguridad', icon: Key },
  { key: 'euro', label: 'Finanzas / Banco', category: 'Finanzas', icon: Euro },
  { key: 'star', label: 'Favorito / Premium', category: 'General', icon: Star },
  { key: 'heart', label: 'Salud / Bienestar', category: 'General', icon: Heart },
  { key: 'subscriptions', label: 'Suscripción', category: 'General', icon: Layers },
  { key: 'widgets', label: 'Servicios', category: 'General', icon: LayoutGrid },
  { key: 'crown', label: 'Premium / VIP', category: 'General', icon: Crown },
  { key: 'flame', label: 'Popular', category: 'General', icon: Flame },
  { key: 'coffee', label: 'Café / Apoyo', category: 'Estilo de vida', icon: Coffee },
];

export const ICON_MAP: Record<string, React.ElementType> = {
  movie: Film,
  Film,
  tv: Tv,
  Tv,
  videocam: Video,
  Video,
  Clapperboard,
  headphones: Headphones,
  Headphones,
  Music,
  mic: Mic,
  Mic,
  radio: Radio,
  Radio,
  chat: MessageSquare,
  Bot,
  auto_awesome: Sparkles,
  Sparkles,
  code: Code,
  Code,
  cloud: Cloud,
  Cloud,
  work: Briefcase,
  laptop: Laptop,
  Laptop,
  games: Gamepad2,
  Gamepad2,
  sports_esports: Gamepad,
  Gamepad,
  school: GraduationCap,
  book: BookOpen,
  BookOpen,
  fitness: Dumbbell,
  soccer: Trophy,
  Trophy,
  shopping: ShoppingBag,
  palette: Palette,
  Palette,
  newspaper: Newspaper,
  lock: Lock,
  key: Key,
  euro: Euro,
  star: Star,
  heart: Heart,
  subscriptions: Layers,
  Layers,
  widgets: LayoutGrid,
  CreditCard,
  Globe,
  Zap,
  ShieldCheck,
  Play,
  Share2,
  Bookmark,
  Coffee,
  Compass,
  Monitor,
  Smartphone,
  Flame,
  Crown,
  FileText
};

export function getIconComponent(key?: string): React.ElementType {
  if (!key) return Layers;
  
  // Check preset services first
  const preset = PRESET_SERVICES.find(p => p.key.toLowerCase() === key.toLowerCase() || p.name.toLowerCase() === key.toLowerCase());
  if (preset && preset.lucideIcon) return preset.lucideIcon;

  const match = AVAILABLE_ICONS.find(i => i.key.toLowerCase() === key.toLowerCase());
  if (match) return match.icon;
  if (ICON_MAP[key]) return ICON_MAP[key];
  return Layers;
}

export function renderSubscriptionIcon(iconName?: string, className = 'w-5 h-5') {
  const IconComponent = getIconComponent(iconName);
  return <IconComponent className={className} />;
}

// Service brand icon or stylized representation
export function renderBrandGlyph(key?: string, iconSizeClass = 'w-6 h-6'): React.ReactNode {
  if (!key) return null;
  const lower = key.toLowerCase().trim();

  if (lower.includes('netflix')) {
    return <span className="font-black text-base tracking-tighter text-red-600 font-sans">N</span>;
  }
  if (lower.includes('spotify')) {
    return (
      <svg className={iconSizeClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.58 14.43c-.18.3-.56.39-.86.21-2.36-1.44-5.33-1.77-8.83-.97-.34.08-.68-.14-.76-.48-.08-.34.14-.68.48-.76 3.83-.87 7.12-.5 9.76 1.12.3.18.39.56.21.88zm1.22-2.73c-.23.38-.72.5-1.1.27-2.7-1.66-6.82-2.14-10.02-1.17-.43.13-.88-.12-1.01-.55-.13-.43.12-.88.55-1.01 3.66-1.11 8.21-.57 11.31 1.34.38.23.5.72.27 1.12zm.12-2.85C14.69 9.07 9.38 8.9 6.29 9.84c-.49.15-1.02-.13-1.17-.62-.15-.49.13-1.02.62-1.17 3.56-1.08 9.42-.88 13.14 1.33.45.27.6.85.33 1.3-.27.45-.85.6-1.3.33z"/>
      </svg>
    );
  }
  if (lower.includes('disney')) {
    return <span className="font-extrabold text-sm tracking-tighter text-white">D+</span>;
  }
  if (lower.includes('youtube')) {
    return (
      <svg className={iconSizeClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/>
      </svg>
    );
  }
  if (lower.includes('chatgpt') || lower.includes('openai')) {
    return <Bot className={iconSizeClass} />;
  }
  if (lower.includes('apple')) {
    return <span className="text-lg leading-none font-sans select-none"></span>;
  }
  if (lower.includes('hbo') || lower.includes('max')) {
    return <span className="font-black text-xs tracking-wider text-white">MAX</span>;
  }
  if (lower.includes('dazn')) {
    return <span className="font-black text-xs tracking-tighter text-white">DAZN</span>;
  }
  if (lower.includes('movistar')) {
    return <span className="font-black text-xs text-white">M+</span>;
  }
  if (lower.includes('nintendo')) {
    return <Gamepad2 className={iconSizeClass} />;
  }
  if (lower.includes('playstation')) {
    return <Gamepad className={iconSizeClass} />;
  }
  if (lower.includes('xbox')) {
    return <Gamepad2 className={iconSizeClass} />;
  }
  if (lower.includes('notion')) {
    return <span className="font-serif font-black text-sm text-white">N</span>;
  }

  return null;
}

export interface PlatformIconBadgeProps {
  platformName?: string;
  iconType?: 'PRESET' | 'VECTOR' | 'CUSTOM_IMAGE' | string;
  iconKey?: string;
  customImageUri?: string;
  customImageBase64?: string;
  iconColorHex?: string;
  sizeClass?: string; // e.g. 'w-12 h-12'
  iconSizeClass?: string; // e.g. 'w-6 h-6'
  roundedClass?: string; // e.g. 'rounded-2xl'
  className?: string;
}

export const PlatformIconBadge: React.FC<PlatformIconBadgeProps> = ({
  platformName = 'Suscripción',
  iconType = 'PRESET',
  iconKey = 'Netflix',
  customImageUri,
  customImageBase64,
  iconColorHex = '#1285FA',
  sizeClass = 'w-12 h-12',
  iconSizeClass = 'w-6 h-6',
  roundedClass = 'rounded-2xl',
  className = '',
}) => {
  const imageSource = (customImageUri && customImageUri.trim() !== '')
    ? customImageUri
    : (customImageBase64
        ? (customImageBase64.startsWith('data:') || customImageBase64.startsWith('blob:') || customImageBase64.startsWith('http')
            ? customImageBase64
            : `data:image/jpeg;base64,${customImageBase64}`)
        : undefined);

  const isCustomImage = (iconType === 'CUSTOM_IMAGE' || Boolean(customImageUri?.trim()) || Boolean(customImageBase64?.trim())) && Boolean(imageSource && imageSource.trim() !== '');

  if (isCustomImage && imageSource) {
    return (
      <div 
        key={`badge-wrap-${imageSource}`}
        className={`${sizeClass} ${roundedClass} overflow-hidden border border-border/80 flex items-center justify-center relative shadow-sm flex-shrink-0 bg-muted/40 ${className}`}
        style={{ backgroundColor: `${iconColorHex}15` }}
      >
        <img
          key={imageSource}
          src={imageSource}
          alt={platformName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            const retries = parseInt(img.dataset.retries || '0', 10);
            if (retries < 3) {
              img.dataset.retries = String(retries + 1);
              // Reintenta tras un breve retardo (la URL de Storage puede tardar en propagarse)
              setTimeout(() => {
                img.src = imageSource + (imageSource.includes('?') ? '&' : '?') + 'retry=' + (retries + 1);
              }, 800 * (retries + 1));
            } else {
              img.style.display = 'none';
            }
          }}
        />
        <span className="absolute text-xs font-black uppercase text-muted-foreground pointer-events-none -z-10">
          {(platformName || 'S').charAt(0)}
        </span>
      </div>
    );
  }

  // Check if we have a specialized glyph
  const effectiveKey = iconKey || platformName;
  const brandGlyph = renderBrandGlyph(effectiveKey, iconSizeClass);

  if (brandGlyph) {
    return (
      <div
        className={`${sizeClass} ${roundedClass} flex items-center justify-center text-white shadow-sm flex-shrink-0 transition-transform ${className}`}
        style={{
          background: `linear-gradient(135deg, ${iconColorHex}, ${iconColorHex}DD)`,
        }}
      >
        {brandGlyph}
      </div>
    );
  }

  const IconComp = getIconComponent(effectiveKey);

  return (
    <div
      className={`${sizeClass} ${roundedClass} flex items-center justify-center text-white shadow-sm flex-shrink-0 transition-transform ${className}`}
      style={{
        background: `linear-gradient(135deg, ${iconColorHex}, ${iconColorHex}DD)`,
      }}
    >
      <IconComp className={iconSizeClass} />
    </div>
  );
};
