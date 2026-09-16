import { useEffect, useRef } from 'react';
import type { TextObject, TextRun } from '../types';
import { runsHaveMultipleColors } from '../utils/richText';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function runsToHtml(text: string, runs: TextRun[] | undefined, baseColor: string): string {
  const effective = runs && runs.length > 0 ? runs : [{ text, color: baseColor }];
  return effective.map((r) => `<span style="color:${r.color}">${escapeHtml(r.text).replace(/\n/g, '<br>')}</span>`).join('');
}

/** Walks the edited contentEditable DOM back into plain text + per-color runs. */
function domToRuns(root: HTMLElement, baseColor: string): { text: string; runs: TextRun[] } {
  const runs: TextRun[] = [];

  function colorFor(node: Node): string {
    let el: HTMLElement | null = node.parentElement;
    while (el && el !== root) {
      if (el.style && el.style.color) return el.style.color;
      el = el.parentElement;
    }
    return baseColor;
  }

  function append(text: string, color: string) {
    if (text.length === 0) return;
    const last = runs[runs.length - 1];
    if (last && last.color === color) last.text += text;
    else runs.push({ text, color });
  }

  function walk(node: Node, isFirstBlock: boolean) {
    if (node.nodeType === Node.TEXT_NODE) {
      append(node.textContent ?? '', colorFor(node));
    } else if (node.nodeName === 'BR') {
      append('\n', colorFor(node));
    } else if (node.nodeName === 'DIV' || node.nodeName === 'P') {
      if (!isFirstBlock) append('\n', colorFor(node));
      node.childNodes.forEach((child) => walk(child, false));
    } else {
      node.childNodes.forEach((child) => walk(child, false));
    }
  }

  root.childNodes.forEach((node, i) => walk(node, i === 0));
  return { text: runs.map((r) => r.text).join(''), runs };
}

type Props = {
  obj: TextObject;
  viewScale: number;
  onCommit: (patch: { text: string; runs?: TextRun[] }) => void;
  onCancel: () => void;
};

export function TextEditOverlay({ obj, viewScale, onCommit, onCancel }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    el.innerHTML = runsToHtml(obj.text, obj.runs, obj.color);
    el.focus();
    try {
      document.execCommand('defaultParagraphSeparator', false, 'br');
    } catch {
      // best-effort — older/unsupported browsers just fall back to default Enter behavior
    }
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && divRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // selectionchange covers every way the selection can change (mouse drag, shift+arrow,
  // double-click-to-select-word, trackpad) — mouseup/keyup below are just a redundant safety net.
  useEffect(() => {
    document.addEventListener('selectionchange', saveSelection);
    return () => document.removeEventListener('selectionchange', saveSelection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = () => {
    const el = divRef.current;
    if (!el) return;
    const { text, runs } = domToRuns(el, obj.color);
    onCommit({ text, runs: runsHaveMultipleColors(runs) ? runs : undefined });
  };

  const applyColor = (color: string) => {
    const el = divRef.current;
    const range = savedRangeRef.current;
    if (!el || !range) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
    try {
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand('foreColor', false, color);
    } catch {
      // no-op — color application is best-effort in unsupported browsers
    }
    saveSelection();
  };

  return (
    <>
      <div
        className="absolute z-10 flex items-center gap-2 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-400 shadow-lg"
        style={{ top: obj.y * viewScale - 34, left: obj.x * viewScale }}
      >
        <span>글자를 드래그해서 선택 후</span>
        <input
          type="color"
          defaultValue={obj.color}
          onMouseDown={saveSelection}
          onChange={(e) => applyColor(e.target.value)}
          className="h-5 w-6 cursor-pointer rounded border border-neutral-700 bg-neutral-800"
          title="선택한 글자 색상 적용"
        />
      </div>
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onBlur={(e) => {
          // Clicking the color input blurs the editable div — don't commit/close in that case.
          if (e.relatedTarget instanceof HTMLInputElement && e.relatedTarget.type === 'color') return;
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
          }
          e.stopPropagation();
        }}
        style={{
          position: 'absolute',
          top: obj.y * viewScale,
          left: obj.x * viewScale,
          width: obj.width * viewScale,
          minHeight: obj.fontSize * viewScale * obj.lineHeight,
          fontSize: obj.fontSize * viewScale,
          fontFamily: obj.fontFamily,
          fontWeight: obj.fontWeight,
          color: obj.color,
          textAlign: obj.align,
          lineHeight: obj.lineHeight,
          transform: `rotate(${obj.rotation}deg)`,
          transformOrigin: 'top left',
          background: 'rgba(0,0,0,0.35)',
          border: '1px dashed #5b8def',
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          padding: 0,
          margin: 0,
        }}
      />
    </>
  );
}
