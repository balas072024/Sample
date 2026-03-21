/**
 * ArivuClaw i18n — Internationalization support.
 * Gap #20: 10 languages with system message translations.
 */
type Translations = Record<string, string>;
export declare class I18n {
    private locale;
    private translations;
    constructor();
    t(key: string, locale?: string, params?: Record<string, string>): string;
    setLocale(locale: string): void;
    getLocale(): string;
    getSupportedLocales(): string[];
    addTranslations(locale: string, translations: Translations): void;
}
export {};
//# sourceMappingURL=locales.d.ts.map