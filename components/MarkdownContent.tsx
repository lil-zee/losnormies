'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface Props { content: string; }

export default function MarkdownContent({ content }: Props) {
  return (
    <div className='markdown-content'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline cursor-pointer break-all"
              onClick={(e) => e.stopPropagation()}
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}