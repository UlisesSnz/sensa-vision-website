import type { Locale } from "./config";

const dictionaries = {
  es: {
    code: {
      copy: "Copiar código", copied: "Código copiado",
      error: "No se pudo copiar. Selecciona el código y cópialo manualmente.",
      block: "Bloque de código", text: "Texto",
    },
    navigation: {
      home: "Página de inicio",
      openMenu: "Abrir menú",
      mainNavigation: "Navegación principal",
      navigationDescription: "Navega por las páginas del sitio",
      openSubmenu: "Abrir submenú de",
      changeLanguage: "Cambiar idioma",
    },
    language: {
      es: "Español",
      en: "Inglés",
    },
    theme: {
      toggle: "Cambiar tema",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
    },
    footer: {
      about: "Sobre nosotros",
      rights: "Todos los derechos reservados.",
    },
    notFound: {
      title: "Página no encontrada",
      backHome: "Volver a la página de inicio",
    },
    blog: {
      home: "Inicio",
      blog: "Blog",
    },
    share: {
      label: "Comparte este post",
      facebook: "Compartir en Facebook",
      linkedin: "Compartir en LinkedIn",
      x: "Compartir en X",
      email: "Compartir por email",
      copy: "Copiar enlace",
      copied: "Enlace copiado",
    },
    forms: {
      required: "es obligatorio",
      invalidEmail: "Ingresa un correo electrónico válido",
      invalidPhone: "Ingresa un número de teléfono válido",
      emailPlaceholder: "Ingresa tu correo electrónico",
      emailRequired: "Ingresa tu correo electrónico",
      newsletterError:
        "No pudimos completar la suscripción. Inténtalo de nuevo.",
      sendMessage: "Enviar mensaje",
      contactSuccess: "Gracias, mensaje enviado correctamente.",
      contactError: "No pudimos enviar tu mensaje. Inténtalo de nuevo.",
    },
    pricing: {
      monthly: "Mensual",
      annual: "Anual",
    },
    media: {
      youtubeTitle: "Video de YouTube",
      unsupportedVideo: "Tu navegador no admite la etiqueta de video.",
      missingVideo: "No hay un video configurado",
    },
    heroScreen: {
      label: "Plantillas de Sensa", carousel: "carrusel", slide: "diapositiva",
      play: "Reproducir", pause: "Pausar",
      previous: "Plantilla anterior", next: "Plantilla siguiente",
      template: "Plantilla", of: "de", standby: "Pantalla en reposo",
      scenes: { office: "Recepción", store: "Tienda", pharmacy: "Farmacia", restaurant: "Cafetería", window: "Escaparate" },
    },
    downloads: {
      comingSoon: "Próximamente",
      defaultLabels: {
        "win32/x64": "Descargar para Windows x64",
        "win32/arm64": "Descargar para Windows ARM64",
        "darwin/x64": "Descargar para macOS Intel",
        "darwin/arm64": "Descargar para macOS Apple Silicon",
        "darwin/universal": "Descargar para macOS Universal",
        "linux/x64": "Descargar para Linux x64",
        "linux/arm64": "Descargar para Linux ARM64",
      },
    },
    draftMode: {
      disable: "Desactivar modo borrador",
    },
  },
  en: {
    code: {
      copy: "Copy code", copied: "Code copied",
      error: "Could not copy. Select the code and copy it manually.",
      block: "Code block", text: "Text",
    },
    navigation: {
      home: "Home page",
      openMenu: "Open menu",
      mainNavigation: "Main navigation",
      navigationDescription: "Navigate through the website pages",
      openSubmenu: "Open submenu for",
      changeLanguage: "Change language",
    },
    language: {
      es: "Spanish",
      en: "English",
    },
    theme: {
      toggle: "Toggle theme",
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    footer: {
      about: "About us",
      rights: "All rights reserved.",
    },
    notFound: {
      title: "Page not found",
      backHome: "Back to the home page",
    },
    blog: {
      home: "Home",
      blog: "Blog",
    },
    share: {
      label: "Share this post",
      facebook: "Share on Facebook",
      linkedin: "Share on LinkedIn",
      x: "Share on X",
      email: "Share by email",
      copy: "Copy link",
      copied: "Link copied",
    },
    forms: {
      required: "is required",
      invalidEmail: "Please enter a valid email",
      invalidPhone: "Please enter a valid phone number",
      emailPlaceholder: "Enter your email",
      emailRequired: "Please enter your email",
      newsletterError:
        "We could not complete the subscription. Please try again.",
      sendMessage: "Send message",
      contactSuccess: "Thank you, your message was sent successfully.",
      contactError: "We could not send your message. Please try again.",
    },
    pricing: {
      monthly: "Monthly",
      annual: "Annual",
    },
    media: {
      youtubeTitle: "YouTube video",
      unsupportedVideo: "Your browser does not support the video tag.",
      missingVideo: "No video configured",
    },
    heroScreen: {
      label: "Sensa templates", carousel: "carousel", slide: "slide",
      play: "Play", pause: "Pause",
      previous: "Previous template", next: "Next template",
      template: "Template", of: "of", standby: "Screen on standby",
      scenes: { office: "Reception", store: "Shop", pharmacy: "Pharmacy", restaurant: "Café", window: "Shop window" },
    },
    downloads: {
      comingSoon: "Coming soon",
      defaultLabels: {
        "win32/x64": "Download for Windows x64",
        "win32/arm64": "Download for Windows ARM64",
        "darwin/x64": "Download for macOS Intel",
        "darwin/arm64": "Download for macOS Apple Silicon",
        "darwin/universal": "Download for macOS Universal",
        "linux/x64": "Download for Linux x64",
        "linux/arm64": "Download for Linux ARM64",
      },
    },
    draftMode: {
      disable: "Disable draft mode",
    },
  },
} as const;

export type UiDictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): UiDictionary {
  return dictionaries[locale];
}
