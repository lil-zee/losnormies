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
            const url = props.href || '';
            let videoId = null;

            try {
              const urlObj = new URL(url);
              if (urlObj.hostname.includes('youtube.com')) {
                if (urlObj.pathname.startsWith('/shorts/')) {
                  videoId = urlObj.pathname.split('/')[2];
                } else {
                  videoId = urlObj.searchParams.get('v');
                }
              } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
              }
            } catch (e) {
              // Invalid URL
            }

            if (videoId && videoId.length === 11) {
              return (
                <span className="block my-1">
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline cursor-pointer break-all"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {videoId && (
                    <div className="mt-2 w-full min-h-[200px] aspect-video bg-black border border-green-900 overflow-hidden" onClick={e => e.stopPropagation()}>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
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