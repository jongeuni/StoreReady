import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useT } from '../i18n';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';
import { useRouter } from '../router';
import { StoreListing } from '../components/StoreListing';
import { REFERENCE_GUIDE_URL, SPONSORS_ENDPOINT, SPONSOR_URL } from '../config';
import { loadReferenceApps } from '../reference/apps';

type Sponsor = { name: string; coffees?: number };

const apps = loadReferenceApps();

function useSponsors(): Sponsor[] | null {
  const [sponsors, setSponsors] = useState<Sponsor[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(SPONSORS_ENDPOINT)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: { sponsors?: Sponsor[] }) => {
        if (cancelled) return;
        const list = Array.isArray(json.sponsors) ? json.sponsors : [];
        setSponsors(list.filter((s) => typeof s?.name === 'string' && s.name.trim()));
      })
      // No endpoint (local dev, static host) or a failure: just show the empty state.
      .catch(() => !cancelled && setSponsors([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return sponsors;
}

export function ReferencePage() {
  const t = useT();
  const { navigate } = useRouter();
  const sponsors = useSponsors();

  const go = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <a href="/" onClick={go('/')} className="text-base font-bold tracking-tight">
          Store<span className="text-blue-400">Ready</span>
        </a>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="py-2" />
          <a
            href="/editor"
            onClick={go('/editor')}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            {t('land.openEditor')}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-12 text-center">
          <h1 className="text-3xl font-bold text-neutral-50">{t('ref.title')}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-400">{t('ref.sub')}</p>
        </motion.section>

        {apps.length > 0 ? (
          <div className="grid justify-items-center gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <StoreListing
                key={app.slug}
                name={app.name}
                icon={app.icon}
                screenshots={app.screenshots}
                href={app.link}
                tagline={app.tagline}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-neutral-500">{t('ref.empty')}</p>
        )}

        <section className="mt-14 rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 text-center">
          <h2 className="text-lg font-bold text-neutral-100">{t('ref.addTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-neutral-400">{t('ref.addBody')}</p>
          <a
            href={REFERENCE_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:border-neutral-500"
          >
            {t('ref.addCta')}
          </a>
        </section>

        <section className="mt-16 border-t border-neutral-800 pt-12 text-center">
          <h2 className="text-2xl font-bold text-neutral-100">{t('spons.title')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-500">{t('spons.sub')}</p>

          {sponsors && sponsors.length > 0 ? (
            <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
              {sponsors.map((s) => (
                <li
                  key={s.name}
                  className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-sm text-neutral-200"
                >
                  {s.name}
                  {s.coffees && s.coffees > 1 ? <span className="ml-1.5 text-xs text-amber-400">☕ {s.coffees}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            sponsors && <p className="mt-6 text-sm text-neutral-600">{t('spons.empty')}</p>
          )}

          {SPONSOR_URL && (
            <a
              href={SPONSOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded bg-amber-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-300"
            >
              ☕ {t('spons.cta')}
            </a>
          )}
        </section>
      </main>
    </div>
  );
}
