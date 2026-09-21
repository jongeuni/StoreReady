import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

const SHOT_W = 136;
const SHOT_GAP = 12;

type Props = {
  name: string;
  /** URL of the app icon; falls back to the first letter of the name on a lime tile. */
  icon?: string;
  screenshots: string[];
  /** Makes the GET button a link to the app. */
  href?: string;
  tagline?: string;
  /** Show the sample star rating (only for the landing-page demo card, never for real apps). */
  showRating?: boolean;
  /** Extra content above the card (e.g. a badge). */
  above?: ReactNode;
  className?: string;
};

/** An App Store product-page look-alike: listing header + a screenshot row that swipes along on its own. */
export function StoreListing({ name, icon, screenshots, href, tagline, showRating = false, above, className = '' }: Props) {
  const [index, setIndex] = useState(0);
  const [snap, setSnap] = useState(false);
  const n = screenshots.length;
  // Render the set twice so the row can slide past the last shot and wrap invisibly.
  const shots = [...screenshots, ...screenshots];

  useEffect(() => {
    if (n < 2) return;
    const id = setInterval(() => {
      setSnap(false);
      setIndex((i) => i + 1);
    }, 2400);
    return () => clearInterval(id);
  }, [n]);

  const getButton = 'rounded-full bg-blue-600 px-5 py-1.5 text-sm font-bold text-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`mx-auto w-full max-w-[22rem] ${className}`}
    >
      {above}
      <div className="overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
        <div className="flex items-center gap-3.5">
          {icon ? (
            <img src={icon} alt="" className="h-16 w-16 shrink-0 rounded-[1.1rem] object-cover shadow-lg" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.1rem] bg-lime-400 shadow-lg">
              <span className="text-2xl font-black tracking-tight text-neutral-950">{name.charAt(0).toUpperCase() || 'D'}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-neutral-50">{name}</div>
            {showRating ? (
              <div className="mt-0.5 text-xs text-neutral-500">
                <span className="text-amber-400">★★★★★</span> 4.9
              </div>
            ) : (
              tagline && <div className="mt-0.5 truncate text-xs text-neutral-500">{tagline}</div>
            )}
          </div>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`${getButton} hover:bg-blue-500`}>
              GET
            </a>
          ) : (
            <span className={getButton}>GET</span>
          )}
        </div>

        <div className="-mr-5 mt-5 overflow-hidden">
          <motion.div
            className="flex"
            style={{ gap: SHOT_GAP }}
            animate={{ x: -index * (SHOT_W + SHOT_GAP) }}
            transition={snap ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
            onAnimationComplete={() => {
              if (n > 0 && index >= n) {
                setSnap(true);
                setIndex(index - n);
              }
            }}
          >
            {shots.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                draggable={false}
                className="shrink-0 rounded-[1.4rem] border border-neutral-800 object-cover"
                style={{ width: SHOT_W, height: SHOT_W * (2796 / 1290) }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
