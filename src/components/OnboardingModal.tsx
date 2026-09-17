import { Button } from './ui/Field';

type Props = {
  onClose: () => void;
};

export function OnboardingModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl"
      >
        <div className="overflow-y-auto p-6">
          <h1 className="text-lg font-bold text-neutral-100">
            Store<span className="text-blue-400">Ready</span>에 오신 걸 환영해요
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            Design your App Store screenshots first, then let your AI coding agent capture the real app screens for
            you.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            이 툴은 실제 스크린샷을 업로드해서 꾸미는 편집기가 아니에요. 먼저 헤드라인·서브헤드라인·폰 배치 같은{' '}
            <strong className="text-neutral-200">마케팅 이미지의 레이아웃을 디자인</strong>하고, 그다음{' '}
            <strong className="text-neutral-200">스크린샷을 채워 넣는</strong> 순서로 작업해요.
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <div className="rounded border border-neutral-800 bg-neutral-950/60 p-4">
              <h2 className="text-sm font-semibold text-blue-300">방법 1 — AI에게 캡처를 맡기기</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm leading-relaxed text-neutral-300">
                <li>캔버스에 폰 placeholder를 놓고 각각 screenshot name을 정해요 (예: home_full)</li>
                <li>
                  상단의 <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">Generate AI Prompt</span>{' '}
                  버튼으로 캡처 지시문을 만들어요
                </li>
                <li>그 프롬프트를 Claude Code, Cursor 같은 AI 코딩 도구에 붙여넣으면, AI가 실제 앱 프로젝트에서 해당 화면을 찾아 캡처해줘요</li>
                <li>캡처된 이미지를 다시 해당 phone에 업로드하면 완성</li>
              </ol>
            </div>

            <div className="rounded border border-neutral-800 bg-neutral-950/60 p-4">
              <h2 className="text-sm font-semibold text-emerald-300">방법 2 — 내가 직접 캡처해서 완성하기</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm leading-relaxed text-neutral-300">
                <li>이미 스크린샷이 있다면 phone placeholder를 선택하고 바로 이미지를 업로드해요</li>
                <li>레이아웃과 텍스트를 원하는 대로 조정해요</li>
                <li>
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">Download PNG</span> 또는{' '}
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">Export All (ZIP)</span>으로 최종
                  이미지를 내려받아요
                </li>
              </ol>
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-snug text-neutral-500">
            두 방법을 페이지마다 섞어서 써도 괜찮아요 — 한 폰은 이미 있는 스크린샷을 업로드하고, 다른 폰은 AI한테
            캡처를 맡기는 식으로요. 이 안내는 상단의 "StoreReady" 로고를 클릭하면 언제든 다시 볼 수 있어요.
          </p>
        </div>

        <div className="flex justify-end border-t border-neutral-800 px-6 py-3">
          <Button variant="primary" onClick={onClose}>
            시작하기
          </Button>
        </div>
      </div>
    </div>
  );
}
