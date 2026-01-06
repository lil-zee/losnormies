'use client';
import { useState, useEffect, useRef } from 'react';
import { relativeTime } from '@/utils/relativeTime';
import { compressImage } from '@/utils/imageCompression';
import { getColorClasses } from '@/utils/colors';
import MarkdownContent from './MarkdownContent';

interface Reply {
    id: string;
    text: string | null;
    imageUrl: string | null;
    createdAt: string;
    ipHash: string;
}

interface Post {
    id: string;
    shortId: string;
    text: string | null;
    imageUrl: string | null;
    createdAt: string;
    replyCount: number;
    replies?: Reply[];
}

interface Props {
    post: {
        id: string;
        shortId: string;
        text?: string;
        imageUrl?: string;
        createdAt: string;
        replyCount: number;
    };
    onClose: () => void;
    adminToken?: string | null;
    onAdminDelete?: () => void;
    userToken?: string | null;
    onRequestIdentity?: () => void;
}

// Helper for foolproof colors
const getHexColor = (id: string | null | undefined) => {
    if (!id) return '#00ff41';
    const colors = ['#00ff41', '#00ffff', '#ff00ff', '#f59e0b', '#ec4899']; // Green, Cyan, Magenta, Amber, Pink
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export default function ThreadModal({ post, onClose, adminToken, onAdminDelete, userToken, onRequestIdentity }: Props) {
    const [thread, setThread] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [replyImage, setReplyImage] = useState<File | null>(null);
    const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Draggable Window State
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [isDraggingWindow, setIsDraggingWindow] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Initial mobile check
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Center initially and set responsive size for desktop
        const w = Math.min(900, window.innerWidth * 0.9);
        const h = Math.min(800, window.innerHeight * 0.8);
        setSize({ width: w, height: h });
        setPosition({ x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2 });

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Resize State
    const [size, setSize] = useState({ width: 900, height: 700 });
    const [isResizing, setIsResizing] = useState(false);
    const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        if (isMobile) return;
        e.stopPropagation();
        setIsResizing(true);
        resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMobile) return;
        if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        setIsDraggingWindow(true);
        dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingWindow) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            }
            if (isResizing) {
                const deltaX = e.clientX - resizeStart.current.x;
                const deltaY = e.clientY - resizeStart.current.y;
                setSize({
                    width: Math.max(320, resizeStart.current.w + deltaX),
                    height: Math.max(400, resizeStart.current.h + deltaY)
                });
            }
        };
        const handleMouseUp = () => {
            setIsDraggingWindow(false);
            setIsResizing(false);
        };

        if (isDraggingWindow || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingWindow, isResizing]);

    // Fetch full thread data
    useEffect(() => {
        const fetchThread = async () => {
            try {
                const res = await fetch(`/api/posts/${post.id}`);
                const data = await res.json();
                if (data.post) {
                    setThread(data.post);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchThread();
    }, [post.id]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const compressed = await compressImage(file);
        setReplyImage(compressed);
        setReplyImagePreview(URL.createObjectURL(compressed));
    };

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userToken) {
            onRequestIdentity?.();
            return;
        }
        if (!replyText && !replyImage) return;

        setIsSubmitting(true);
        setError('');

        try {
            let imageUrl = null;
            if (replyImage) {
                const formData = new FormData();
                formData.append('file', replyImage);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error);
                imageUrl = uploadData.url;
            }

            const res = await fetch(`/api/posts/${post.id}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-token': userToken || ''
                },
                body: JSON.stringify({ text: replyText || undefined, imageUrl }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Add new reply to list locally
            if (thread) {
                const newReply = {
                    id: data.reply.id,
                    text: data.reply.text,
                    imageUrl: data.reply.imageUrl,
                    createdAt: new Date().toISOString(),
                    ipHash: 'you', // placeholder
                };
                setThread({ ...thread, replies: [...(thread.replies || []), newReply] });
            }

            // Reset form
            setReplyText('');
            setReplyImage(null);
            setReplyImagePreview(null);
        } catch (err: any) {
            setError(err.message || 'Failed to reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdminDelete = () => {
        if (confirm('ADMIN: DELETE THREAD?')) {
            if (onAdminDelete) onAdminDelete();
            onClose();
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 font-mono text-green-500">
                LOADING THREAD...
            </div>
        );
    }

    if (!thread) return null;

    return (
        <div style={{ position: 'fixed', left: 0, top: 0, width: 0, height: 0, zIndex: 50 }}>
            <div
                className={`flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-zinc-950 border-2 border-green-500 ${isMobile ? 'fixed inset-0 w-full h-full z-50' : 'absolute'}`}
                style={!isMobile ? {
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    width: size.width,
                    height: size.height
                } : {}}
                onClick={e => e.stopPropagation()}
            >
                {/* CRT Scanline Overlay for Modal */}
                <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

                {/* Header (Draggable Handle) */}
                <div
                    className="p-3 border-b-2 border-green-600 flex justify-between items-center bg-gray-900 shrink-0 relative z-20 cursor-move"
                    onMouseDown={handleMouseDown}
                >
                    <h2 className="text-base font-bold text-green-500 font-mono tracking-wider truncate pr-2">
                        THREAD: {thread.id.substring(0, 8)}
                        {/* Admin Delete Button */}
                        {adminToken && (
                            <button
                                onClick={handleAdminDelete}
                                className="ml-4 bg-red-900/50 text-red-500 border border-red-500 px-2 text-xs hover:bg-red-900"
                            >
                                [DELETE]
                            </button>
                        )}
                    </h2>
                    <button onClick={onClose} className="text-green-500 hover:text-white font-mono">[X]</button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* Main Post */}
                    <div className="mb-6 border-b border-green-900 pb-4">
                        <div className="text-xs text-green-800 font-mono mb-2 flex justify-between">
                            <span>{relativeTime(thread.createdAt)}</span>
                            <span>ID: {thread.shortId}</span>
                        </div>

                        {thread.imageUrl && (
                            <div className="mb-4 flex justify-center bg-gray-900/30">
                                <img
                                    src={thread.imageUrl}
                                    alt=""
                                    className="object-contain border border-green-900"
                                    style={{ maxHeight: '250px', maxWidth: '100%', width: 'auto' }}
                                />
                            </div>
                        )}
                        {thread.text && (
                            <div className="text-green-400 text-lg mb-2 font-mono break-all whitespace-pre-wrap w-full overflow-hidden">
                                <MarkdownContent content={thread.text} />
                            </div>
                        )}
                        POSTED {relativeTime(thread.createdAt).toUpperCase()}
                    </div>
                </div>

                {/* Replies */}
                <div className="space-y-2">
                    {thread.replies?.map((reply, i) => {
                        // Total Anonymity: Color based on Reply ID
                        const color = getHexColor(reply.id);
                        const uniqueId = reply.id.slice(0, 8);

                        return (
                            <div key={reply.id} className="bg-black/40 p-4 border-b border-green-900/30 last:border-0" style={{ borderLeft: `4px solid ${color}` }}>
                                <div className="text-xs mb-1 flex justify-between font-mono" style={{ color: color }}>
                                    <span>ID: {uniqueId}</span>
                                    <span>{relativeTime(reply.createdAt).toUpperCase()}</span>
                                </div>
                                {reply.imageUrl && (
                                    <img src={reply.imageUrl} alt="" className="object-contain mb-2 border border-green-900/50" style={{ maxHeight: '150px', maxWidth: '100%' }} />
                                )}
                                {reply.text && <div className={`text-gray-300 font-mono text-sm break-all whitespace-pre-wrap w-full overflow-hidden`}><MarkdownContent content={reply.text} /></div>}
                            </div>
                        );
                    })}
                    {(!thread.replies || thread.replies.length === 0) && (
                        <p className="text-green-800 text-center py-4 italic font-mono">NO REPLIES YET.</p>
                    )}
                </div>
                {/* Reply Form */}
                <div className="p-4 bg-black border-t-2 border-green-600 relative z-20">
                    <form onSubmit={handleSubmitReply}>
                        {replyImagePreview && (
                            <div className="mb-2 relative border border-green-800 bg-gray-900 w-fit max-w-full group">
                                <img src={replyImagePreview} alt="Preview" className="max-h-32 max-w-[200px] object-contain block" style={{ maxWidth: '200px' }} />
                                <button
                                    type="button"
                                    onClick={() => { setReplyImage(null); setReplyImagePreview(null); }}
                                    className="absolute -top-2 -right-2 bg-red-600 text-black font-bold w-6 h-6 flex items-center justify-center text-xs border border-white shadow-[2px_2px_0_black]"
                                >
                                    X
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-2 bg-black border border-green-500 text-green-500 hover:bg-green-900 font-mono"
                                title="Add Image"
                            >
                                IMG
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />

                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="REPLY..."
                                className="flex-1 bg-black border border-green-600 px-3 py-2 text-green-400 focus:outline-none focus:border-green-400 font-mono placeholder-green-900 resize-none h-12 text-sm"
                            />

                            <button
                                type="submit"
                                disabled={isSubmitting || (!replyText && !replyImage)}
                                className="bg-green-700 text-black font-bold px-4 py-2 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase"
                            >
                                {isSubmitting ? '...' : 'Send'}
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-xs mt-2 font-mono">{error}</p>}
                    </form>
                </div>

                {/* Resize Handle (Desktop Only) */}
                {!isMobile && (
                    <div
                        className="absolute bottom-0 right-0 w-6 h-6 bg-green-500/20 cursor-se-resize z-50 flex items-end justify-end p-1"
                        onMouseDown={handleResizeMouseDown}
                    >
                        <div className="w-2 h-2 border-r-2 border-b-2 border-green-500"></div>
                    </div>
                )}
            </div>
        </div>


    );
}
