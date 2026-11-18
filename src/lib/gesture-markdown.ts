import katex from 'katex';
import { renderCommentMarkdown } from './comment-markdown';

export function renderGestureMarkdown(message: string) {
  return renderCommentMarkdown(message, (math, displayMode) => katex.renderToString(math, {
    displayMode, throwOnError: false, trust: false, maxExpand: 500, maxSize: 10,
  }));
}
