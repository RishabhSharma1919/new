import React, { useMemo } from "react";

export function MarkdownPreview({ content }: { content: string }) {
  const renderedHtml = useMemo(() => {
    if (!content.trim()) return "<p class='markdown-empty'>No description provided yet.</p>";

    // Simple, secure, and lightweight markdown parser
    let html = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // Blockquote
    html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");

    // Checklists: - [ ] and - [x]
    html = html.replace(/^- \[x\] (.*$)/gim, "<div class='md-checkbox is-checked'><span>☑</span> $1</div>");
    html = html.replace(/^- \[ \] (.*$)/gim, "<div class='md-checkbox'><span>☐</span> $1</div>");

    // Unordered lists
    html = html.replace(/^- (.*$)/gim, "<li>$1</li>");

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Paragraphs / Linebreaks
    html = html.replace(/\n\n+/g, "</p><p>");
    html = html.replace(/\n/g, "<br />");

    return `<p>${html}</p>`;
  }, [content]);

  return (
    <div
      className="markdown-rendered-view"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
