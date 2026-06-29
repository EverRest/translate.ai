import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
};

export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 120,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const GAP = 6;
      let x = 0;
      let y = 0;
      switch (side) {
        case 'top':
          x = r.left + r.width / 2;
          y = r.top - GAP;
          break;
        case 'bottom':
          x = r.left + r.width / 2;
          y = r.bottom + GAP;
          break;
        case 'left':
          x = r.left - GAP;
          y = r.top + r.height / 2;
          break;
        case 'right':
          x = r.right + GAP;
          y = r.top + r.height / 2;
          break;
      }
      setPos({ x, y });
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const transformMap: Record<string, string> = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="contents"
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999] max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 shadow-2xl"
            style={{
              left: pos.x,
              top: pos.y,
              transform: transformMap[side],
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
