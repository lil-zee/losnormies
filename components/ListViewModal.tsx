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
        <div className="fixed inset-0 bg-black z-[100] flex flex-col font-mono text-green-500 overflow-hidden animate-enter">
            {/* Header Content constrained width */}
            <div className="w-full max-w-4xl mx-auto flex flex-col h-full bg-black border-x border-green-900/30">

                <div className="flex justify-between items-center border-b-2 border-green-500 p-4 shrink-0 bg-gray-900/50">
                    <h2 className="text-2xl font-bold tracking-widest text-shadow-glow">ARCHIVE_FEED</h2>
                    <div className="flex gap-4 items-center">
                        <span className="text-xs text-green-700 hidden md:inline">TOTAL: {sortedPosts.length}</span>
                        <button onClick={onClose} className="text-xl hover:text-white font-bold border border-green-500 hover:bg-green-900 px-4 py-1">[ CLOSE ]</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {sortedPosts.map(post => (
                        <div
                            key={post.id}
                            onClick={() => { onSelectPost(post); onClose(); }}
                            className="group border-b border-green-900/50 hover:bg-green-900/10 cursor-pointer transition-all p-4 flex gap-4 md:gap-6 items-start"
                        >
                            {/* ID Column */}
                            <div className="w-16 shrink-0 pt-1 hidden md:block">
                                <span className="text-xs text-green-800 font-bold block">#{post.shortId.slice(0, 8)}</span>
                                <span className="text-[10px] text-gray-600 block mt-1">{relativeTime(post.createdAt)}</span>
                            </div>

                            {/* Image Thumb */}
                            <div className="shrink-0">
                                {post.imageUrl ? (
                                    <div className={`w-24 h-24 md:w-32 md:h-32 bg-gray-900 border border-green-900 group-hover:border-green-500 transition-colors flex items-center justify-center overflow-hidden ${post.isNSFW ? 'blur-md hover:blur-none transition-all duration-300' : ''}`}>
                                        <img src={post.imageUrl} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 md:w-32 md:h-32 bg-green-900/5 border border-green-900 flex items-center justify-center text-green-900">
                                        <span className="text-2xl opacity-20">TXT</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2 items-center">
                                        {post.isNSFW && <span className="bg-red-900/50 text-red-500 text-[10px] px-1 border border-red-900">NSFW</span>}
                                        <span className="md:hidden text-xs text-green-700 font-bold">#{post.shortId.slice(0, 8)}</span>
                                        <span className="md:hidden text-[10px] text-gray-600">{relativeTime(post.createdAt)}</span>
                                    </div>
                                    <div className="flex gap-3 text-xs text-gray-500 font-bold">
                                        {post.replyCount > 0 && <span className="text-blue-400">💬 {post.replyCount}</span>}
                                        {post.likes > 0 && <span className="text-yellow-500">★ {post.likes}</span>}
                                    </div>
                                </div>

                                <div className={`text-gray-300 text-sm md:text-base line-clamp-4 group-hover:line-clamp-none transition-all ${post.isNSFW ? 'blur-[2px] group-hover:blur-none' : ''}`}>
                                    {post.text ? <MarkdownContent content={post.text} /> : <span className="italic text-gray-700">No text content</span>}
                                </div>
                            </div>
                        </div>
                    ))}

                    {sortedPosts.length === 0 && (
                        <div className="p-20 text-center text-green-800 italic">
                            NO DATA FOUND IN ARCHIVE.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
