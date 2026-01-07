'use client';

interface Post {
  id: string;
  x: number;
  y: number;
  text?: string;
  createdAt: string;
  replyCount: number;
}

interface Props {
  posts: Post[];
  onSelect: (p: Post) => void;
}

export default function Sidebar({ posts, onSelect }: Props) {
  // Sort by recent
  const sorted = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  return (
    <div className="fixed top-20 left-4 w-64 hidden lg:flex flex-col gap-2 z-30 pointer-events-none">
      <div className="bg-black/80 backdrop-blur-md border border-green-900/50 p-2 pointer-events-auto">
        <h3 className="text-green-500 font-mono text-xs border-b border-green-900 pb-1 mb-2 tracking-widest">
            ACTIVE SIGNALS
        </h3>
        <ul className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {sorted.map(post => (
                <li 
                    key={post.id} 
                    onClick={() => onSelect(post)}
                    className="cursor-pointer group hover:bg-green-900/20 p-2 border border-transparent hover:border-green-800 transition-all"
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-green-700 font-mono">#{post.id.slice(0,4)}</span>
                        {post.replyCount > 0 && <span className="text-[9px] bg-green-900 text-green-300 px-1">{post.replyCount}R</span>}
                    </div>
                    <p className="text-green-400 text-xs font-mono line-clamp-2 leading-tight opacity-70 group-hover:opacity-100">
                        {post.text || '[MEDIA CONTENT]'}
                    </p>
                </li>
            ))}
            {sorted.length === 0 && <li className="text-green-900 text-xs italic p-2">Scanning...</li>}
        </ul>
      </div>
      
      <div className="bg-black/80 backdrop-blur-md border border-green-900 p-2 pointer-events-auto mt-2">
         <div className="text-[10px] text-green-600 font-mono leading-relaxed">
            SYSTEM ONLINE<br/>
            NODES: {posts.length}<br/>
            ENCRYPTION: NONE
         </div>
      </div>
    </div>
  );
}
