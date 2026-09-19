import { LANGUAGES, useI18n, useT, type Lang } from '.';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const lang = useI18n((s) => s.lang);
  const setLang = useI18n((s) => s.setLang);
  const t = useT();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label={t('common.language')}
      title={t('common.language')}
      className={`rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 ${className}`}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
