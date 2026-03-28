'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizableChatPanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

/**
 * A panel that can be resized by dragging its left edge.
 * Used to wrap PatientChat in the patient detail page.
 */
export default function ResizableChatPanel({
  children,
  defaultWidth = 380,
  minWidth = 300,
  maxWidth = 600,
}: ResizableChatPanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(defaultWidth);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // Dragging left edge — moving mouse left increases width
      const delta = startX.current - e.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [minWidth, maxWidth]);

  return (
    <aside
      className="hidden lg:flex bg-white border-l border-slate-200 flex-col shrink-0 overflow-hidden relative"
      style={{ width }}
      aria-label="AI Assistant"
    >
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 group hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat panel"
        aria-valuenow={width}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setWidth((w) => Math.min(maxWidth, w + 20));
          if (e.key === 'ArrowRight') setWidth((w) => Math.max(minWidth, w - 20));
        }}
      >
        <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors" />
      </div>
      {children}
    </aside>
  );
}
