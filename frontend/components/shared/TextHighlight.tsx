import React, { memo, useMemo } from 'react';

interface TextHighlightProps {
  text: string;
  searchTerm: string;
  className?: string;
}

export const TextHighlight = memo(({ text, searchTerm, className = "" }: TextHighlightProps) => {
  const highlightedText = useMemo(() => {
    if (!searchTerm || !text) {
      return <span className={className}>{text}</span>;
    }

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);

    return (
      <span className={className}>
        {parts.map((part, index) => {
          if (regex.test(part)) {
            return (
              <mark
                key={index}
                className="bg-yellow-200 text-yellow-900 font-medium rounded px-1"
              >
                {part}
              </mark>
            );
          }
          return part;
        })}
      </span>
    );
  }, [text, searchTerm, className]);

  return highlightedText;
});

TextHighlight.displayName = 'TextHighlight'; 