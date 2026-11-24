import React, { useMemo } from 'react';
import katex from 'katex';

export function MathBlock({ tex, display = false, className = '' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return tex;
    }
  }, [tex, display]);

  if (display) {
    return (
      <div
        className={`math-display-box ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
