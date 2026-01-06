'use client';
import { relativeTime } from '@/utils/relativeTime';

interface Post {
  id: string;
  shortId: string;
  x: number;
  y: number;
  text?: string;
  imageUrl?: string;
  createdAt: string;
  replyCount: number;
  likes: number;
  isNSFW?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

export default function ListViewModal({ isOpen, onClose, posts, onSelectPost }: Props) {
  if (!isOpen) return null;

  const sortedPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="fixed inset-0 bg-black/95 z-50 p-4 md:p-10 flex flex-col font-mono text-green-500 animate-enter">
        <div className="flex justify-between items-center border-b-2 border-green-500 pb-4 mb-4">
            <h2 className="text-2xl font-bold tracking-widest text-shadow-glow">ARCHIVE_LIST_VIEW</h2>
            <button onClick={onClose} className="text-xl hover:text-white font-bold border border-transparent hover:border-green-500 px-2">[X]</button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-green-900 bg-black/50">
            <table className="w-full text-left border-collapse">
                <thead className="bg-green-900/20 text-green-300 sticky top-0 backdrop-blur-md z-10">
                    <tr>
                        <th className="p-3 border-b border-green-500 font-bold uppercase text-sm">ID</th>
                        <th className="p-3 border-b border-green-500 font-bold uppercase text-sm w-1/2">Content</th>
                        <th className="p-3 border-b border-green-500 font-bold uppercase text-sm text-center">R</th>
                        <th className="p-3 border-b border-green-500 font-bold uppercase text-sm text-center">★</th>
                        <th className="p-3 border-b border-green-500 font-bold uppercase text-sm text-right">Age</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPosts.map(post => (
                        <tr 
                            key={post.id} 
                            onClick={() => { onSelectPost(post); onClose(); }}
                            className="hover:bg-green-900/30 cursor-pointer border-b border-green-900/30 transition-colors group"
                        >
                            <td className="p-3 font-mono text-xs text-green-700 group-hover:text-green-400 font-bold">{post.shortId.slice(0,8)}</td>
                            <td className="p-3 max-w-0">
                                <div className="truncate text-gray-300 group-hover:text-white">
                                    {post.isNSFW && <span className="text-red-500 font-bold mr-2">[NSFW]</span>}
                                    {post.imageUrl && <span className="text-blue-400 mr-2">[IMG]</span>}
                                    {post.text || <span className="italic text-gray-600">No text</span>}
                                </div>
                            </td>
                            <td className="p-3 text-center text-xs text-gray-400 font-bold">{post.replyCount > 0 ? post.replyCount : <span className="text-gray-800">-</span>}</td>
                            <td className="p-3 text-center text-xs text-yellow-600 font-bold">{post.likes > 0 ? post.likes : <span className="text-gray-800">-</span>}</td>
                            <td className="p-3 text-right text-xs text-gray-500 whitespace-nowrap">{relativeTime(post.createdAt)}</td>
                        </tr>
                    ))}
                    {sortedPosts.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-10 text-center text-green-800 italic">NO DATA FOUND IN SECTOR.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="mt-2 text-xs text-green-800 flex justify-between">
            <span>TOTAL RECORDS: {sortedPosts.length}</span>
            <span>SYSTEM STATUS: ONLINE</span>
        </div>
    </div>
  );
}
