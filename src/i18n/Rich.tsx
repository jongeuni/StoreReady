import { Fragment } from 'react';

type Props = {
  text: string;
  /** Class for **highlighted** spans. */
  strong?: string;
  /** Class for [[chip]] spans. */
  chip?: string;
};

const TOKEN = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g;

/** Renders translated strings with light inline markup: "\n" -> <br/>, **x** -> highlight, [[x]] -> chip. */
export function Rich({
  text,
  strong = 'font-semibold text-neutral-100',
  chip = 'rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-200',
}: Props) {
  return (
    <>
      {text.split('\n').map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.split(TOKEN).map((part, pi) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <span key={pi} className={strong}>
                  {part.slice(2, -2)}
                </span>
              );
            }
            if (part.startsWith('[[') && part.endsWith(']]')) {
              return (
                <span key={pi} className={chip}>
                  {part.slice(2, -2)}
                </span>
              );
            }
            return <Fragment key={pi}>{part}</Fragment>;
          })}
        </Fragment>
      ))}
    </>
  );
}
