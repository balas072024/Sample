"use strict";
/**
 * ArivuClaw i18n — Internationalization support.
 * Gap #20: 10 languages with system message translations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18n = void 0;
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("i18n");
const DEFAULT_TRANSLATIONS = {
    en: {
        "welcome": "Welcome to ArivuClaw! Type /help for commands.",
        "error.generic": "An error occurred. Please try again.",
        "error.rate_limited": "You're sending messages too quickly. Please wait.",
        "error.not_found": "Not found.",
        "help": "Commands: /help, /skills, /status, /memory, /clear, /quit",
        "status.running": "ArivuClaw is running",
        "status.stopped": "ArivuClaw is stopped",
        "skill.loaded": "Skill loaded: {name}",
        "skill.not_found": "Skill not found: {name}",
        "memory.stored": "Remembered.",
        "memory.cleared": "Memory cleared.",
        "goodbye": "Goodbye!",
    },
    ta: {
        "welcome": "அறிவுக்ளா-வுக்கு வரவேற்கிறோம்! உதவிக்கு /help தட்டவும்.",
        "error.generic": "பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
        "error.rate_limited": "மிக வேகமாக செய்திகள் அனுப்புகிறீர்கள். காத்திருக்கவும்.",
        "help": "கட்டளைகள்: /help, /skills, /status, /memory, /clear, /quit",
        "goodbye": "நன்றி, பிறகு சந்திப்போம்!",
    },
    hi: {
        "welcome": "अरिवुक्लॉ में आपका स्वागत है! /help टाइप करें।",
        "error.generic": "एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
        "goodbye": "अलविदा!",
    },
    es: {
        "welcome": "¡Bienvenido a ArivuClaw! Escribe /help para comandos.",
        "error.generic": "Ocurrió un error. Inténtalo de nuevo.",
        "goodbye": "¡Adiós!",
    },
    fr: {
        "welcome": "Bienvenue sur ArivuClaw ! Tapez /help pour les commandes.",
        "error.generic": "Une erreur s'est produite. Veuillez réessayer.",
        "goodbye": "Au revoir !",
    },
    de: {
        "welcome": "Willkommen bei ArivuClaw! Tippe /help für Befehle.",
        "error.generic": "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
        "goodbye": "Auf Wiedersehen!",
    },
    ja: {
        "welcome": "ArivuClawへようこそ！/helpでコマンド一覧を表示します。",
        "error.generic": "エラーが発生しました。もう一度お試しください。",
        "goodbye": "さようなら！",
    },
    zh: {
        "welcome": "欢迎使用 ArivuClaw！输入 /help 查看命令。",
        "error.generic": "发生错误，请重试。",
        "goodbye": "再见！",
    },
    ko: {
        "welcome": "ArivuClaw에 오신 것을 환영합니다! /help를 입력하세요.",
        "error.generic": "오류가 발생했습니다. 다시 시도해 주세요.",
        "goodbye": "안녕히 가세요!",
    },
    ar: {
        "welcome": "!مرحبًا بك في ArivuClaw! اكتب /help للأوامر",
        "error.generic": ".حدث خطأ. يرجى المحاولة مرة أخرى",
        "goodbye": "!مع السلامة",
    },
};
class I18n {
    locale = "en";
    translations;
    constructor() {
        this.translations = { ...DEFAULT_TRANSLATIONS };
    }
    t(key, locale, params) {
        const l = locale || this.locale;
        let text = this.translations[l]?.[key] || this.translations.en?.[key] || key;
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                text = text.replace(`{${k}}`, v);
            }
        }
        return text;
    }
    setLocale(locale) { this.locale = locale; }
    getLocale() { return this.locale; }
    getSupportedLocales() { return Object.keys(this.translations); }
    addTranslations(locale, translations) {
        this.translations[locale] = { ...this.translations[locale], ...translations };
    }
}
exports.I18n = I18n;
//# sourceMappingURL=locales.js.map