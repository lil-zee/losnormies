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
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 1000, pointerEvents: 'none' }}>
            {/* Transparent backdrop for clicking out */}
            <div
                className="absolute inset-0 pointer-events-auto"
                onClick={onClose}
            />

            <div
                className={`win95-window flex flex-col pointer-events-auto shadow-xl ${isMobile ? 'fixed inset-0 w-full h-full' : 'absolute'}`}
                style={!isMobile ? {
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    width: size.width,
                    height: size.height
                } : {}}
                onClick={e => e.stopPropagation()}
            >
                {/* Title Bar */}
                <div
                    className="win95-title-bar cursor-move select-none"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center gap-1">
                        <span className="font-bold">Notepad - {thread.shortId}</span>
                    </div>
                    <div className="flex gap-1">
                        {adminToken && (
                            <button onClick={handleAdminDelete} className="win95-btn bg-red-100 text-[10px] px-1 h-4">DEL</button>
                        )}
                        <button onClick={onClose} className="win95-btn w-4 h-4 p-0 leading-none">X</button>
                    </div>
                </div>

                {/* Menu Bar */}
                <div className="flex bg-[#c0c0c0] px-1 py-0.5 border-b border-gray-400 text-xs gap-3">
                    <span className="underline">F</span>ile
                    <span className="underline">E</span>dit
                    <span className="underline">S</span>earch
                    <span className="underline">H</span>elp
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white border-t-2 border-l-2 border-[#808080] border-r-2 border-b-2 border-[#fff] mx-1 my-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-2">
                        {/* OP Post */}
                        <div className="mb-4">
                            <div className="text-xs text-gray-500 mb-1 flex justify-between border-b border-gray-300 pb-1">
                                <span>{relativeTime(thread.createdAt)}</span>
                                <span className="font-bold text-black">#{thread.shortId}</span>
                            </div>

                            {thread.imageUrl && (
                                <div className="mb-2 flex justify-center bg-[#808080] p-1 border border-black">
                                    <img
                                        src={thread.imageUrl}
                                        alt=""
                                        className="object-contain max-h-[300px]"
                                        style={{ maxWidth: '100%' }}
                                    />
                                </div>
                            )}
                            {thread.text && (
                                <div className="text-black text-sm font-[font-family:'MS_Sans_Serif'] break-words">
                                    <MarkdownContent content={thread.text} />
                                </div>
                            )}
                        </div>

                        {/* Replies */}
                        <div className="space-y-1 bg-[#e0e0e0] p-1 border-t border-gray-400">
                            <div className="text-xs font-bold text-gray-600 mb-1">{thread.replies?.length || 0} Comments</div>
                            {thread.replies?.map((reply) => {
                                const color = getHexColor(reply.id); // Keeping color for identity distinction
                                return (
                                    <div key={reply.id} className="bg-white border border-gray-400 p-1 text-sm mb-1">
                                        <div className="text-[10px] text-gray-500 mb-1 flex justify-between bg-[#f0f0f0] px-1">
                                            <span style={{ color: '#000', fontWeight: 'bold' }}>{reply.id.slice(0, 8)}</span>
                                            <span>{relativeTime(reply.createdAt)}</span>
                                        </div>
                                        {reply.imageUrl && (
                                            <div className="mb-1">
                                                <img src={reply.imageUrl} className="max-h-32 object-contain border border-gray-300" />
                                            </div>
                                        )}
                                        {reply.text && <div className="px-1"><MarkdownContent content={reply.text} /></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reply Form (Bottom docked) */}
                    <div className="bg-[#c0c0c0] border-t border-gray-400 p-1">
                        <form onSubmit={handleSubmitReply}>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full h-12 border-2 border-[#808080] bg-white text-sm p-1 font-sans resize-none mb-1 focus:outline-none"
                            />
                            <div className="flex justify-between items-center">
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="win95-btn px-2 py-0.5 text-xs"
                                    >
                                        Attach...
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    {replyImagePreview && <span className="text-xs text-blue-800 ml-2">Image Attached</span>}
                                </div>
                                <button type="submit" disabled={isSubmitting} className="win95-btn px-4 py-0.5 font-bold text-xs">
                                    {isSubmitting ? 'Sending...' : 'Post Reply'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Resize Handle */}
                {!isMobile && (
                    <div
                        className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5"
                        onMouseDown={handleResizeMouseDown}
                    >
                        {/* Grip lines */}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="gray">
                            <line x1="0" y1="10" x2="10" y2="0" stroke="gray" strokeWidth="1" />
                            <line x1="3" y1="10" x2="10" y2="3" stroke="gray" strokeWidth="1" />
                            <line x1="6" y1="10" x2="10" y2="6" stroke="gray" strokeWidth="1" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
