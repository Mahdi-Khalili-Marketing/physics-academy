'use client'

import React, { useMemo } from 'react'
import katex from 'katex'

type MathTextProps = {
  text?: string | null
  className?: string
  as?: 'div' | 'span' | 'p'
}

type Segment = {
  type: 'text' | 'inline-math' | 'block-math'
  content: string
}

/**
 * Parses mixed text containing LaTeX math:
 * - $$...$$ or \[...\] for block math
 * - $...$ or \(...\) for inline math
 */
function parseMathSegments(rawText: string): Segment[] {
  if (!rawText) return []

  const segments: Segment[] = []
  // Regex to match block math ($$...$$ or \[...\]) and inline math ($...$ or \(...\))
  const mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\))/g
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = mathRegex.exec(rawText)) !== null) {
    // Text before match
    if (match.index > lastIdx) {
      segments.push({
        type: 'text',
        content: rawText.slice(lastIdx, match.index),
      })
    }

    const matchedStr = match[0]
    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      segments.push({
        type: 'block-math',
        content: matchedStr.slice(2, -2).trim(),
      })
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
      segments.push({
        type: 'block-math',
        content: matchedStr.slice(2, -2).trim(),
      })
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      segments.push({
        type: 'inline-math',
        content: matchedStr.slice(1, -1).trim(),
      })
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      segments.push({
        type: 'inline-math',
        content: matchedStr.slice(2, -2).trim(),
      })
    }

    lastIdx = match.index + matchedStr.length
  }

  // Trailing text
  if (lastIdx < rawText.length) {
    segments.push({
      type: 'text',
      content: rawText.slice(lastIdx),
    })
  }

  return segments
}

// Module-level in-memory cache for rendered KaTeX formulas to eliminate duplicate CPU parsing
const katexCache = new Map<string, string>()

function renderKatexSafe(content: string, isBlock: boolean): string {
  const cacheKey = `${isBlock ? 'B' : 'I'}:${content}`
  const cached = katexCache.get(cacheKey)
  if (cached) return cached

  try {
    const rendered = katex.renderToString(content, {
      displayMode: isBlock,
      throwOnError: false,
      output: 'html',
    })
    // Limit cache size to 500 items to prevent unbounded memory growth
    if (katexCache.size > 500) {
      const firstKey = katexCache.keys().next().value
      if (firstKey) katexCache.delete(firstKey)
    }
    katexCache.set(cacheKey, rendered)
    return rendered
  } catch {
    return content
  }
}

export const MathText = React.memo(function MathText({ text, className = '', as: Component = 'span' }: MathTextProps) {
  const segments = useMemo(() => parseMathSegments(text || ''), [text])

  if (!text) return null

  return (
    <Component className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <React.Fragment key={idx}>{seg.content}</React.Fragment>
        }

        const isBlock = seg.type === 'block-math'
        const renderedHtml = renderKatexSafe(seg.content, isBlock)

        if (isBlock) {
          return (
            <span
              key={idx}
              dir="ltr"
              className="block my-2 text-center overflow-x-auto py-1 max-w-full"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )
        }

        return (
          <span
            key={idx}
            dir="ltr"
            className="inline-block mx-1 align-baseline select-text font-normal unicode-bidi-isolate"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )
      })}
    </Component>
  )
})
