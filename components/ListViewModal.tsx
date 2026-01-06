'use client';
import { relativeTime } from '@/utils/relativeTime';
import MarkdownContent from './MarkdownContent';

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
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col font-mono text-green-500 overflow-hidden animate-enter items-center justify-center p-4">
            <div className="w-full max-w-4xl flex flex-col h-[80vh] bg-black border border-green-900 shadow-[0_0_20px_rgba(0,255,0,0.1)]">

                <div className="flex justify-between items-center border-b border-green-800 p-2 shrink-0 bg-green-900/10">
                    <h2 className="text-lg font-bold tracking-widest pl-2">ARCHIVE_LOG</h2>
                    <button onClick={onClose} className="text-sm hover:bg-green-900 px-3 py-1 border border-transparent hover:border-green-500 transition-colors">[CLOSE]</button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black p-2">
                    <table className="w-full text-left text-xs md:text-sm border-collapse">
                        <thead className="sticky top-0 bg-black border-b border-green-900 text-green-700 z-10">
                            <tr>
                                <th className="p-2 w-24">TIME</th>
                                <th className="p-2 w-24">ID</th>
                                <th className="p-2">CONTENT</th>
                                <th className="p-2 w-16 text-center">IMG</th>
                                <th className="p-2 w-12 text-center">R</th>
                                <th className="p-2 w-12 text-center">★</th>
                            </tr>
                        </thead>
                        <tbody className="animate-stagger">
                            {sortedPosts.map(post => (
                                <tr
                                    key={post.id}
                                    onClick={() => { onSelectPost(post); onClose(); }}
                                    className="group hover:bg-green-900/20 cursor-pointer border-b border-green-900/10 transition-colors"
                                >
                                    <td className="p-2 text-gray-500 whitespace-nowrap font-mono">{relativeTime(post.createdAt)}</td>
                                    <td className="p-2 text-green-800 font-bold group-hover:text-green-500">#{post.shortId.slice(0, 8)}</td>
                                    <td className="p-2 text-gray-400 group-hover:text-white truncate max-w-[200px] md:max-w-md">
                                        {post.isNSFW && <span className="text-red-600 mr-2 font-bold">!NSFW</span>}
                                        {post.text || <span className="opacity-30 italic">No text</span>}
                                    </td>
                                    <td className="p-2 text-center">
                                        {post.imageUrl ? (
                                            <span className="text-blue-400 group-hover:text-blue-300" title="Has Image">▓</span>
                                        ) : <span className="opacity-10">.</span>}
                                    </td>
                                    <td className="p-2 text-center text-gray-600 group-hover:text-green-400">{post.replyCount || '-'}</td>
                                    <td className="p-2 text-center text-yellow-700 group-hover:text-yellow-500">{post.likes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedPosts.length === 0 && <div className="p-10 text-center text-gray-800 italic">EMPTY LOG</div>}
                </div>
                <div className="p-1 text-[10px] text-green-900 text-right bg-black border-t border-green-900">
                    ROWS: {sortedPosts.length}
                </div>
            </div>
        </div>
    );
}
