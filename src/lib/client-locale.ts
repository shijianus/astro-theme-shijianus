import {
  type SupportedLocale,
  type LocaleVariant,
  SUPPORTED_LOCALES,
  LOCALE_VARIANT_KEY,
  MANUAL_LOCALE_KEY,
  ensureUserPersona,
  normaliseLocale,
  updateCandidatePairWithManualChoice,
} from './user-persona.ts';

export type { SupportedLocale, LocaleVariant };
export { SUPPORTED_LOCALES, LOCALE_VARIANT_KEY, MANUAL_LOCALE_KEY };

export interface LocaleMetadata {
  code: LocaleVariant;
  nativeName: string;
  englishName: string;
  badge: string;
  flag: string;
}

export const LOCALE_METADATA: Record<LocaleVariant, LocaleMetadata> = {
  'zh-CN': { code: 'zh-CN', nativeName: '简体中文', englishName: 'Simplified Chinese', badge: '简', flag: '🇨🇳' },
  'zh-Hant': { code: 'zh-Hant', nativeName: '繁體中文', englishName: 'Traditional Chinese', badge: '繁', flag: '🇭🇰' },
  en: { code: 'en', nativeName: 'English', englishName: 'English', badge: 'EN', flag: '🇺🇸' },
  fr: { code: 'fr', nativeName: 'Français', englishName: 'French', badge: 'FR', flag: '🇫🇷' },
  es: { code: 'es', nativeName: 'Español', englishName: 'Spanish', badge: 'ES', flag: '🇪🇸' },
  de: { code: 'de', nativeName: 'Deutsch', englishName: 'German', badge: 'DE', flag: '🇩🇪' },
};

const zhPattern = /[\u3400-\u9fff]/;
const originalTextNodeMap = new WeakMap<Text, string>();
const originalAttributeMap = new WeakMap<Element, Map<string, string>>();
let zhToTraditional: ((value: string) => string) | null = null;
let zhToSimplified: ((value: string) => string) | null = null;
let chineseConverterPromise: Promise<void> | null = null;

export type TranslationDict = Record<'en' | 'fr' | 'es' | 'de', string>;

/**
 * Multilingual dictionaries covering navigation, actions, controls, widgets, comments, and profile drawers.
 */
export const MULTILINGUAL_DICTIONARY: Record<string, TranslationDict> = {
  // Navigation & Core Pages
  '首页': { en: 'Home', fr: 'Accueil', es: 'Inicio', de: 'Startseite' },
  '归档': { en: 'Archives', fr: 'Archives', es: 'Archivos', de: 'Archiv' },
  '分类': { en: 'Categories', fr: 'Catégories', es: 'Categorías', de: 'Kategorien' },
  '标签': { en: 'Tags', fr: 'Étiquettes', es: 'Etiquetas', de: 'Schlagwörter' },
  '关于': { en: 'About', fr: 'À propos', es: 'Acerca de', de: 'Über' },
  '更多': { en: 'More', fr: 'Plus', es: 'Más', de: 'Mehr' },
  '公告': { en: 'Notice', fr: 'Annonces', es: 'Avisos', de: 'Ankündigung' },
  '实验室': { en: 'Lab', fr: 'Laboratoire', es: 'Laboratorio', de: 'Labor' },
  '友链与社群': { en: 'Community', fr: 'Communauté', es: 'Comunidad', de: 'Community' },
  '友链与社群入口': { en: 'Community entry', fr: 'Entrée communauté', es: 'Entrada comunidad', de: 'Community-Zugang' },
  '站点状态': { en: 'Status', fr: 'Statut', es: 'Estado', de: 'Status' },
  '主题路线': { en: 'Roadmap', fr: 'Feuille de route', es: 'Hoja de ruta', de: 'Roadmap' },
  '交换建议': { en: 'Exchange guide', fr: 'Guide déchange', es: 'Guía de intercambio', de: 'Austausch-Leitfaden' },
  '适合互链的站点': { en: 'Sites for link exchange', fr: 'Sites recommandés', es: 'Sitios para intercambio', de: 'Websites für Linktausch' },
  '联系路径': { en: 'Contact', fr: 'Contact', es: 'Contacto', de: 'Kontakt' },
  '优先通过 TG 联系': { en: 'Prefer Telegram', fr: 'Contact via TG', es: 'Preferir Telegram', de: 'Bevorzugt via Telegram' },
  '当前状态': { en: 'Current status', fr: 'Statut actuel', es: 'Estado actual', de: 'Aktueller Status' },
  '现在已经是正式入口': { en: 'Official entry', fr: 'Entrée officielle', es: 'Entrada oficial', de: 'Offizieller Zugang' },
  '偏好': { en: 'Preferences', fr: 'Préférences', es: 'Preferencias', de: 'Einstellungen' },
  '上一页': { en: 'Prev', fr: 'Précédent', es: 'Anterior', de: 'Zurück' },
  '下一页': { en: 'Next', fr: 'Suivant', es: 'Siguiente', de: 'Weiter' },
  '上页': { en: 'Prev', fr: 'Préc', es: 'Ant', de: 'Zurück' },
  '下页': { en: 'Next', fr: 'Suiv', es: 'Sig', de: 'Weiter' },
  '文章分页': { en: 'Pagination', fr: 'Pagination', es: 'Paginación', de: 'Seitennummerierung' },

  // Background modes
  '切换背景：晨光背景': { en: 'Background: Daybreak', fr: 'Arrière-plan: Aurore', es: 'Fondo: Amanecer', de: 'Hintergrund: Morgengrauen' },
  '切换背景：网格背景': { en: 'Background: Grid', fr: 'Arrière-plan: Grille', es: 'Fondo: Cuadrícula', de: 'Hintergrund: Gitter' },
  '切换背景：星空背景': { en: 'Background: Starfield', fr: 'Arrière-plan: Étoiles', es: 'Fondo: Cielo estrellado', de: 'Hintergrund: Sternenhimmel' },
  '切换背景：星云背景': { en: 'Background: Nebula', fr: 'Arrière-plan: Nébuleuse', es: 'Fondo: Nebulosa', de: 'Hintergrund: Nebel' },
  '切换背景：极光背景': { en: 'Background: Aurora', fr: 'Arrière-plan: Aurore boréale', es: 'Fondo: Aurora', de: 'Hintergrund: Polarlicht' },
  '切换背景：纯净背景': { en: 'Background: Clean', fr: 'Arrière-plan: Épuré', es: 'Fondo: Limpio', de: 'Hintergrund: Schlicht' },
  '切换明暗模式': { en: 'Toggle theme', fr: 'Changer de thème', es: 'Cambiar tema', de: 'Farbschema umschalten' },
  '切换背景': { en: 'Change background', fr: 'Changer fond', es: 'Cambiar fondo', de: 'Hintergrund ändern' },

  // Rightside controls & Top Dock
  '回到顶部': { en: 'Back to top', fr: 'Haut de page', es: 'Volver arriba', de: 'Nach oben' },
  '控制台': { en: 'Console', fr: 'Console', es: 'Consola', de: 'Konsole' },
  '账号中心': { en: 'Account', fr: 'Compte', es: 'Cuenta', de: 'Konto' },
  '账号面板': { en: 'Account panel', fr: 'Panneau de compte', es: 'Panel de cuenta', de: 'Kontoverwaltung' },
  '归档时间线': { en: 'Archive timeline', fr: 'Chronologie', es: 'Línea de tiempo', de: 'Zeitleiste' },
  '站内搜索': { en: 'Search', fr: 'Recherche', es: 'Buscar', de: 'Suche' },
  '关闭搜索面板': { en: 'Close search', fr: 'Fermer recherche', es: 'Cerrar búsqueda', de: 'Suche schließen' },
  '关闭控制台': { en: 'Close console', fr: 'Fermer console', es: 'Cerrar consola', de: 'Konsole schließen' },
  '关闭控制台提示': { en: 'Close console notice', fr: 'Fermer avis', es: 'Cerrar aviso', de: 'Hinweis schließen' },
  '关闭账号面板': { en: 'Close account panel', fr: 'Fermer compte', es: 'Cerrar cuenta', de: 'Konto schließen' },
  '关闭面板': { en: 'Close panel', fr: 'Fermer panneau', es: 'Cerrar panel', de: 'Fenster schließen' },
  '阅读模式': { en: 'Reading mode', fr: 'Mode lecture', es: 'Modo lectura', de: 'Lesemodus' },
  '退出阅读模式': { en: 'Exit reading mode', fr: 'Quitter mode lecture', es: 'Salir del modo lectura', de: 'Lesemodus beenden' },
  '展开侧栏': { en: 'Expand sidebar', fr: 'Déplier barre latérale', es: 'Expandir lateral', de: 'Seitenleiste ausklappen' },
  '收起侧栏': { en: 'Collapse sidebar', fr: 'Replier barre latérale', es: 'Plegar lateral', de: 'Seitenleiste einklappen' },
  '展开设置': { en: 'Expand dock', fr: 'Ouvrir réglages', es: 'Abrir ajustes', de: 'Einstellungen öffnen' },
  '收起设置': { en: 'Collapse dock', fr: 'Fermer réglages', es: 'Cerrar ajustes', de: 'Einstellungen schließen' },
  '隐藏选单': { en: 'Hide dock', fr: 'Masquer menu', es: 'Ocultar menú', de: 'Menü ausblenden' },
  '直达评论': { en: 'Jump to comments', fr: 'Aller aux commentaires', es: 'Ir a comentarios', de: 'Zu den Kommentaren' },
  '切换语言': { en: 'Switch language', fr: 'Changer de langue', es: 'Cambiar idioma', de: 'Sprache wechseln' },

  // Table of contents & Post details
  '文章目录': { en: 'Table of contents', fr: 'Sommaire', es: 'Índice', de: 'Inhaltsverzeichnis' },
  '当前定位': { en: 'Current section', fr: 'Section actuelle', es: 'Sección actual', de: 'Aktueller Abschnitt' },
  '最新发布': { en: 'Latest posts', fr: 'Derniers articles', es: 'Últimas publicaciones', de: 'Neueste Beiträge' },
  '最近文章': { en: 'Recent posts', fr: 'Articles récents', es: 'Publicaciones recientes', de: 'Letzte Beiträge' },
  '站点信息': { en: 'Site info', fr: 'Infos du site', es: 'Información del sitio', de: 'Website-Info' },
  '分类总数': { en: 'Categories', fr: 'Catégories', es: 'Categorías', de: 'Kategorien' },
  '标签总数': { en: 'Tags', fr: 'Étiquettes', es: 'Etiquetas', de: 'Schlagwörter' },
  '文章总数': { en: 'Posts', fr: 'Articles', es: 'Artículos', de: 'Beiträge' },
  '阅读总量': { en: 'Reading', fr: 'Lectures', es: 'Lecturas', de: 'Aufrufe' },
  '阅读时长': { en: 'Reading time', fr: 'Temps de lecture', es: 'Tiempo de lectura', de: 'Lesezeit' },
  '最近更新': { en: 'Latest update', fr: 'Mise à jour', es: 'Última actualización', de: 'Letzte Aktualisierung' },
  '当前阶段': { en: 'Current phase', fr: 'Phase actuelle', es: 'Fase actual', de: 'Aktuelle Phase' },
  '目录定位': { en: 'TOC jump', fr: 'Navigation', es: 'Saltar a índice', de: 'Zum Inhaltsverzeichnis' },
  '评论入口': { en: 'Comments', fr: 'Commentaires', es: 'Comentarios', de: 'Kommentare' },
  '分享卡片': { en: 'Share', fr: 'Partager', es: 'Compartir', de: 'Teilen' },
  '打开二维码': { en: 'Open QR', fr: 'Ouvrir QR', es: 'Abrir QR', de: 'QR-Code öffnen' },
  '查看二维码': { en: 'View QR', fr: 'Voir le QR', es: 'Ver QR', de: 'QR-Code ansehen' },
  '分享这篇文章': { en: 'Share this post', fr: 'Partager cet article', es: 'Compartir este artículo', de: 'Diesen Beitrag teilen' },
  '扫码分享': { en: 'QR share', fr: 'Partage QR', es: 'Compartir vía QR', de: 'Per QR teilen' },
  '复制链接': { en: 'Copy link', fr: 'Copier le lien', es: 'Copiar enlace', de: 'Link kopieren' },
  '原创': { en: 'Original', fr: 'Original', es: 'Original', de: 'Original' },
  '转载': { en: 'Reprint', fr: 'Rediffusion', es: 'Reimpresión', de: 'Nachdruck' },

  // Comments
  '评论': { en: 'Comments', fr: 'Commentaires', es: 'Comentarios', de: 'Kommentare' },
  '公开评论': { en: 'Public comments', fr: 'Commentaires publics', es: 'Comentarios públicos', de: 'Öffentliche Kommentare' },
  '还没有公开评论': { en: 'No public comments yet', fr: 'Aucun commentaire public pour le moment', es: 'Aún no hay comentarios públicos', de: 'Noch keine öffentlichen Kommentare' },
  '回复': { en: 'Reply', fr: 'Répondre', es: 'Responder', de: 'Antworten' },
  '取消回复': { en: 'Cancel reply', fr: 'Annuler', es: 'Cancelar respuesta', de: 'Antwort abbrechen' },
  '引用回复': { en: 'Quote', fr: 'Citer', es: 'Citar', de: 'Zitieren' },
  '发送评论': { en: 'Submit comment', fr: 'Publier le commentaire', es: 'Enviar comentario', de: 'Kommentar absenden' },
  '发送': { en: 'Send', fr: 'Envoyer', es: 'Enviar', de: 'Senden' },
  '最新': { en: 'Latest', fr: 'Récents', es: 'Más recientes', de: 'Neueste' },
  '最热': { en: 'Hot', fr: 'Populaires', es: 'Más populares', de: 'Beliebteste' },
  '站长': { en: 'Author', fr: 'Auteur', es: 'Autor', de: 'Autor' },
  '博主': { en: 'Blogger', fr: 'Blogueur', es: 'Blogger', de: 'Blogger' },
  '访客': { en: 'Visitor', fr: 'Visiteur', es: 'Visitante', de: 'Besucher' },
  '输入评论内容...': { en: 'Write a comment...', fr: 'Écrire un commentaire...', es: 'Escribe un comentario...', de: 'Schreibe einen Kommentar...' },

  // Account & Preferences
  '登录 / 注册': { en: 'Sign in / Register', fr: 'Connexion / Inscription', es: 'Iniciar sesión / Registro', de: 'Anmelden / Registrieren' },
  '更新资料': { en: 'Edit profile', fr: 'Modifier le profil', es: 'Editar perfil', de: 'Profil bearbeiten' },
  '昵称': { en: 'Name', fr: 'Nom', es: 'Nombre', de: 'Name' },
  '邮箱': { en: 'Email', fr: 'E-mail', es: 'Correo electrónico', de: 'E-Mail' },
  '个人站点': { en: 'Website', fr: 'Site web', es: 'Sitio web', de: 'Website' },
  '头像链接': { en: 'Avatar URL', fr: 'URL de l avatar', es: 'URL del avatar', de: 'Avatar-URL' },
  '退出': { en: 'Sign out', fr: 'Déconnexion', es: 'Cerrar sesión', de: 'Abmelden' },
  '创建账号': { en: 'Create profile', fr: 'Créer un profil', es: 'Crear perfil', de: 'Profil erstellen' },
  '保存更新': { en: 'Save updates', fr: 'Enregistrer', es: 'Guardar cambios', de: 'Speichern' },
  '保存': { en: 'Save', fr: 'Enregistrer', es: 'Guardar', de: 'Speichern' },
  '语言': { en: 'Language', fr: 'Langue', es: 'Idioma', de: 'Sprache' },
  '界面语言': { en: 'Interface language', fr: 'Langue de l interface', es: 'Idioma de la interfaz', de: 'Oberflächensprache' },
  '简体': { en: 'Simplified', fr: 'Simplifié', es: 'Simplificado', de: 'Vereinfacht' },
  '繁體': { en: 'Traditional', fr: 'Traditionnel', es: 'Tradicional', de: 'Traditionell' },
  '简体中文': { en: 'Simplified Chinese', fr: 'Chinois simplifié', es: 'Chino simplificado', de: 'Vereinfachtes Chinesisch' },
  '繁體中文': { en: 'Traditional Chinese', fr: 'Chinois traditionnel', es: 'Chino tradicional', de: 'Traditionelles Chinesisch' },
  '站内通知接收偏好': { en: 'Notification Preferences', fr: 'Préférences de notification', es: 'Preferencias de notificación', de: 'Benachrichtigungseinstellungen' },
  '全站广播与新博文发布通告': { en: 'Site broadcast & new posts', fr: 'Diffusions et nouveaux articles', es: 'Difusión y nuevas publicaciones', de: 'Website-Mitteilungen & neue Beiträge' },
  '提醒': { en: 'Notifications', fr: 'Notifications', es: 'Notificaciones', de: 'Benachrichtigungen' },
  '@ 与回复': { en: '@ mentions', fr: '@ mentions et réponses', es: '@ menciones y respuestas', de: '@ Erwähnungen & Antworten' },
  '提示': { en: 'Notice', fr: 'Avis', es: 'Aviso', de: 'Hinweis' },
  '打赏作者': { en: 'Support the author', fr: 'Soutenir l auteur', es: 'Apoyar al autor', de: 'Autor unterstützen' },
  'Telegram 频道': { en: 'Telegram channel', fr: 'Canal Telegram', es: 'Canal de Telegram', de: 'Telegram-Kanal' },
  '海外读者交流入口': { en: 'Overseas reader entrance', fr: 'Accès lecteurs étrangers', es: 'Entrada lectores externos', de: 'Internationaler Leserzugang' },
  '中国大陆': { en: 'Mainland China', fr: 'Chine continentale', es: 'China continental', de: 'Festlandchina' },
  '中国香港': { en: 'Hong Kong', fr: 'Hong Kong', es: 'Hong Kong', de: 'Hongkong' },
  '英国': { en: 'United Kingdom', fr: 'Royaume-Uni', es: 'Reino Unido', de: 'Vereinigtes Königreich' },
  '隐私说明': { en: 'Privacy policy', fr: 'Politique de confidentialité', es: 'Política de privacidad', de: 'Datenschutz' },
  '版权说明': { en: 'Copyright policy', fr: 'Droits d auteur', es: 'Derechos de autor', de: 'Urheberrecht' },
  '使用条款': { en: 'Terms of service', fr: 'Conditions d utilisation', es: 'Términos de servicio', de: 'Nutzungsbedingungen' },
  '友链': { en: 'Friends', fr: 'Amis', es: 'Amigos', de: 'Freunde' },
  '服务': { en: 'Services', fr: 'Services', es: 'Servicios', de: 'Dienste' },
  '主题': { en: 'Theme', fr: 'Thème', es: 'Tema', de: 'Theme' },
  '导航': { en: 'Navigation', fr: 'Navigation', es: 'Navegación', de: 'Navigation' },
  '协议': { en: 'Policies', fr: 'Politiques', es: 'Políticas', de: 'Richtlinien' },
  '最新文章': { en: 'Latest posts', fr: 'Articles récents', es: 'Publicaciones recientes', de: 'Neueste Beiträge' },
  '博客分类': { en: 'Blog categories', fr: 'Catégories du blog', es: 'Categorías del blog', de: 'Blog-Kategorien' },
  '本次重构': { en: 'This rebuild', fr: 'Cette refonte', es: 'Esta reconstrucción', de: 'Diese Neugestaltung' },
  '继续阅读': { en: 'Read more', fr: 'Lire la suite', es: 'Leer más', de: 'Weiterlesen' },
  '验证后阅读': { en: 'Unlock to read', fr: 'Débloquer pour lire', es: 'Desbloquear para leer', de: 'Freischalten zum Lesen' },
  '分类详情': { en: 'Category detail', fr: 'Détail de la catégorie', es: 'Detalle de categoría', de: 'Kategorie-Details' },
  '标签详情': { en: 'Tag detail', fr: 'Détail de l étiquette', es: 'Detalle de etiqueta', de: 'Schlagwort-Details' },
  '分类索引': { en: 'Category index', fr: 'Index des catégories', es: 'Índice de categorías', de: 'Kategorie-Index' },
  '标签索引': { en: 'Tag index', fr: 'Index des étiquettes', es: 'Índice de etiquetas', de: 'Schlagwort-Index' },
  '该分类下的文章': { en: 'Posts in this category', fr: 'Articles de cette catégorie', es: 'Artículos en esta categoría', de: 'Beiträge in dieser Kategorie' },
  '该标签下的文章': { en: 'Posts with this tag', fr: 'Articles avec cette étiquette', es: 'Artículos con esta etiqueta', de: 'Beiträge mit diesem Schlagwort' },
};

const translatableAttributes = ['title', 'placeholder', 'aria-label', 'aria-description', 'alt'] as const;
const skipTags = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'KBD', 'SAMP']);
const skipSelector = '.ignore-opencc,[data-no-translate="true"]';

type TranslateMutationOptions = {
  refreshBase?: boolean;
  attributes?: readonly string[];
};

declare global {
  interface Window {
    __SHIJIANUS_LOCALE_RUNTIME__?: {
      initialized: boolean;
      translating: boolean;
      observer: MutationObserver | null;
      currentVariant: LocaleVariant;
      scheduled: number | null;
      preparing: boolean;
    };
  }
}

function getRuntimeState() {
  if (typeof window === 'undefined') {
    return {
      initialized: false,
      translating: false,
      observer: null,
      currentVariant: 'zh-CN' as LocaleVariant,
      scheduled: null as number | null,
      preparing: false,
    };
  }

  window.__SHIJIANUS_LOCALE_RUNTIME__ ??= {
    initialized: false,
    translating: false,
    observer: null,
    currentVariant: 'zh-CN',
    scheduled: null,
    preparing: false,
  };

  return window.__SHIJIANUS_LOCALE_RUNTIME__;
}

export function normaliseLocaleVariant(value: string | null | undefined): LocaleVariant {
  return normaliseLocale(value);
}

/**
 * Reads the stored or inferred locale variant.
 * Respects explicit user selection first, then falls back to Intelligent Persona inference.
 */
export function readStoredLocaleVariant(): LocaleVariant {
  if (typeof window === 'undefined') return 'zh-CN';

  try {
    const docVariant = typeof document !== 'undefined' ? document.documentElement.dataset.localeVariant : null;
    if (docVariant) {
      return normaliseLocaleVariant(docVariant);
    }

    const storedVariant = window.localStorage.getItem(LOCALE_VARIANT_KEY);
    if (storedVariant) {
      return normaliseLocaleVariant(storedVariant);
    }

    // Inferred by persona engine
    const persona = ensureUserPersona();
    return persona.primaryLocale;
  } catch {
    return 'zh-CN';
  }
}

function shouldObserveLocaleMutations(variant: LocaleVariant) {
  return variant !== 'zh-CN';
}

async function ensureChineseConverters() {
  if (zhToTraditional && zhToSimplified) return;
  if (!chineseConverterPromise) {
    chineseConverterPromise = import('opencc-js').then(({ Converter }) => {
      zhToTraditional = Converter({ from: 'cn', to: 'tw' });
      zhToSimplified = Converter({ from: 'tw', to: 'cn' });
    });
  }
  await chineseConverterPromise;
}

/**
 * Text translation router based on variant
 */
export function convertText(value: string, variant: LocaleVariant): string {
  if (!value) return value;

  // 1. Target is Simplified Chinese
  if (variant === 'zh-CN') {
    if (!zhPattern.test(value)) return value;
    return zhToSimplified ? zhToSimplified(value) : value;
  }

  // 2. Target is Traditional Chinese
  if (variant === 'zh-Hant') {
    if (!zhPattern.test(value)) return value;
    return zhToTraditional ? zhToTraditional(value) : value;
  }

  // 3. Target is en / fr / es / de
  const langKey = variant as 'en' | 'fr' | 'es' | 'de';
  const trimmed = value.trim();
  if (!trimmed) return value;

  // Direct match
  const entry = MULTILINGUAL_DICTIONARY[trimmed];
  if (entry && entry[langKey]) {
    return value.replace(trimmed, entry[langKey]);
  }

  // Check partial prefix (e.g. "切换背景：晨光背景")
  for (const [zhKey, translations] of Object.entries(MULTILINGUAL_DICTIONARY)) {
    if (trimmed.includes(zhKey) && translations[langKey]) {
      return value.replace(zhKey, translations[langKey]);
    }
  }

  return value;
}

function rememberOriginalTextValue(node: Text, currentValue: string, refreshBase = false) {
  if (refreshBase || !originalTextNodeMap.has(node)) {
    originalTextNodeMap.set(node, currentValue);
    return currentValue;
  }
  return originalTextNodeMap.get(node) ?? currentValue;
}

function setOriginalAttributeValue(element: Element, attribute: string, currentValue: string) {
  let store = originalAttributeMap.get(element);
  if (!store) {
    store = new Map();
    originalAttributeMap.set(element, store);
  }
  store.set(attribute, currentValue);
  return currentValue;
}

function getOriginalAttributeValue(element: Element, attribute: string, currentValue: string) {
  let store = originalAttributeMap.get(element);
  if (!store) {
    store = new Map();
    originalAttributeMap.set(element, store);
  }
  const existing = store.get(attribute);
  if (existing) return existing;
  store.set(attribute, currentValue);
  return currentValue;
}

function shouldSkipElement(element: Element) {
  return skipTags.has(element.tagName) || Boolean(element.closest(skipSelector));
}

function translateAttributes(element: Element, variant: LocaleVariant, options: TranslateMutationOptions = {}) {
  if (shouldSkipElement(element)) return;

  const attributes = options.attributes ?? translatableAttributes;

  for (const attribute of attributes) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const base = options.refreshBase
      ? setOriginalAttributeValue(element, attribute, current)
      : getOriginalAttributeValue(element, attribute, current);
    if (!zhPattern.test(base) && !MULTILINGUAL_DICTIONARY[base.trim()]) continue;
    const next = convertText(base, variant);
    if (next !== current) element.setAttribute(attribute, next);
  }
}

function translateTextNode(node: Text, variant: LocaleVariant, options: TranslateMutationOptions = {}) {
  if (!node.nodeValue) return;
  const parent = node.parentElement;
  if (parent && shouldSkipElement(parent)) return;
  const base = rememberOriginalTextValue(node, node.nodeValue, options.refreshBase);
  if (!zhPattern.test(base) && !MULTILINGUAL_DICTIONARY[base.trim()]) return;
  const next = convertText(base, variant);
  if (next !== node.nodeValue) node.nodeValue = next;
}

function translateTree(root: Element | DocumentFragment, variant: LocaleVariant, options: TranslateMutationOptions = {}) {
  const state = getRuntimeState();
  state.translating = true;

  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let current: Node | null = root;

    if (current instanceof Element) translateAttributes(current, variant, options);

    while ((current = walker.nextNode())) {
      if (current instanceof Element) {
        translateAttributes(current, variant, options);
        continue;
      }
      if (current instanceof Text) translateTextNode(current, variant, options);
    }
  } finally {
    state.translating = false;
  }
}

function disconnectLocaleObserver() {
  const state = getRuntimeState();
  state.observer?.disconnect();
  state.observer = null;
}

function handleLocaleMutations(mutations: MutationRecord[]) {
  const state = getRuntimeState();
  if (state.translating || state.currentVariant === 'zh-CN') return;

  for (const mutation of mutations) {
    if (mutation.type === 'characterData' && mutation.target instanceof Text) {
      translateTextNode(mutation.target, state.currentVariant, { refreshBase: true });
      continue;
    }

    if (mutation.type === 'attributes' && mutation.target instanceof Element && mutation.attributeName) {
      translateAttributes(mutation.target, state.currentVariant, {
        refreshBase: true,
        attributes: [mutation.attributeName],
      });
      continue;
    }

    if (mutation.type !== 'childList') continue;

    mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) {
        translateTree(node, state.currentVariant, { refreshBase: true });
        return;
      }
      if (node instanceof Text) {
        translateTextNode(node, state.currentVariant, { refreshBase: true });
      }
    });
  }
}

function syncLocaleObserver() {
  if (typeof window === 'undefined' || !document.body) return;

  const state = getRuntimeState();
  if (!shouldObserveLocaleMutations(state.currentVariant)) {
    disconnectLocaleObserver();
    return;
  }

  if (!state.observer) {
    state.observer = new MutationObserver(handleLocaleMutations);
  } else {
    state.observer.disconnect();
  }

  state.observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...translatableAttributes],
  });
}

function queueLocaleTranslation(variant: LocaleVariant, force = false) {
  if (typeof window === 'undefined' || !document.body) return;

  const state = getRuntimeState();
  if (!force && variant === 'zh-CN') return;
  if (state.scheduled || state.preparing) return;

  const queueFrame = () => {
    if (state.scheduled || !document.body) return;

    state.scheduled = window.requestAnimationFrame(() => {
      state.scheduled = null;
      if (!document.body || state.translating || getRuntimeState().currentVariant !== variant) return;
      translateTree(document.body, variant);
    });
  };

  if ((variant === 'zh-Hant' || variant === 'zh-CN') && (!zhToTraditional || !zhToSimplified)) {
    state.preparing = true;
    void ensureChineseConverters()
      .then(() => {
        state.preparing = false;
        if (getRuntimeState().currentVariant !== variant) return;
        queueFrame();
      })
      .catch(() => {
        state.preparing = false;
      });
    return;
  }

  queueFrame();
}

/**
 * Applies a specific locale variant.
 */
export function applyLocaleVariant(
  variant: LocaleVariant,
  options: {
    persist?: boolean;
    translate?: boolean;
    manual?: boolean;
  } = {},
) {
  if (typeof document === 'undefined') return variant;

  const state = getRuntimeState();
  const nextVariant = normaliseLocaleVariant(variant);
  const persist = options.persist ?? true;
  const shouldTranslate = options.translate ?? true;
  const manual = options.manual ?? false;

  state.currentVariant = nextVariant;
  document.documentElement.dataset.localeVariant = nextVariant;
  document.documentElement.lang = nextVariant;
  syncLocaleObserver();

  if (persist) {
    try {
      window.localStorage.setItem(LOCALE_VARIANT_KEY, nextVariant);
      if (manual) {
        window.localStorage.setItem(MANUAL_LOCALE_KEY, nextVariant);
        updateCandidatePairWithManualChoice(nextVariant);
      }
    } catch {}
  }

  window.dispatchEvent(new CustomEvent<LocaleVariant>('shijianus:localechange', { detail: nextVariant }));

  if (shouldTranslate && document.body) {
    queueLocaleTranslation(nextVariant, true);
  }

  return nextVariant;
}

/**
 * Minimal 2-Language cycle toggle for the #translate button.
 * Swaps exclusively between the 2 inferred or customized candidate pair languages.
 */
export function toggleLocaleVariant(current?: LocaleVariant): LocaleVariant {
  const docVariant = typeof document !== 'undefined' ? (document.documentElement.dataset.localeVariant as LocaleVariant) : null;
  const activeVariant = current || docVariant || readStoredLocaleVariant();
  const persona = ensureUserPersona();
  const [first, second] = persona.candidatePair;

  // Toggle exclusively between the 2 candidate languages
  const nextVariant = normaliseLocaleVariant(activeVariant) === first ? second : first;
  console.log('[toggleLocaleVariant]', { activeVariant, first, second, nextVariant });
  return applyLocaleVariant(nextVariant, { persist: true, translate: true, manual: false });
}

/**
 * Get display info and badge for a locale
 */
export function getLocaleBadge(variant: LocaleVariant): string {
  return LOCALE_METADATA[variant]?.badge || 'EN';
}

export function initLocaleRuntime() {
  if (typeof window === 'undefined') return;

  const state = getRuntimeState();
  if (state.initialized) return;

  state.initialized = true;
  state.currentVariant = readStoredLocaleVariant();

  const syncLocaleVariant = (event?: Event) => {
    if (event instanceof CustomEvent) {
      state.currentVariant = normaliseLocaleVariant(event.detail);
    } else {
      state.currentVariant = readStoredLocaleVariant();
    }
    syncLocaleObserver();
    queueLocaleTranslation(state.currentVariant, true);
  };

  syncLocaleObserver();

  window.addEventListener('shijianus:localechange', syncLocaleVariant as EventListener);
  window.addEventListener('storage', (event) => {
    if (event.key === LOCALE_VARIANT_KEY || event.key === MANUAL_LOCALE_KEY) {
      syncLocaleVariant();
    }
  });

  if (state.currentVariant !== 'zh-CN') {
    queueLocaleTranslation(state.currentVariant, true);
  }
}
