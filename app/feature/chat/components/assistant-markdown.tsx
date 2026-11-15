import { memo } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
    a: ({ children, href, title }) => (
        <a href={href} title={title} target="_blank" rel="noopener noreferrer">{children}</a>
    ),
    table: ({ children }) => (
        <div className="craft-markdown-table" tabIndex={0} role="region" aria-label="Response table">
            <table>{children}</table>
        </div>
    ),
    pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,
};

export const AssistantMarkdown = memo(function AssistantMarkdown({ content }: { content: string }) {
    return (
        <div className="craft-markdown">
            <Markdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
                {content}
            </Markdown>
        </div>
    );
});
