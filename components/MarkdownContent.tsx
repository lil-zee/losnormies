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
          a: ({ node, ...props }) => {
            const isYoutube = props.href?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);

            if (isYoutube) {
              const videoId = isYoutube[1];
              return (
                <span className="block my-1">
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline cursor-pointer break-all"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="mt-2 relative w-full pt-[56.25%] bg-black border border-green-900" onClick={e => e.stopPropagation()}>
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </span>
              );
            }

            return (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline cursor-pointer break-all"
                onClick={(e) => e.stopPropagation()}
              />
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}