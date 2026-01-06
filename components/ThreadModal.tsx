'use client';
import { useState, useEffect, useRef } from 'react';
import { relativeTime } from '@/utils/relativeTime';
import { compressImage } from '@/utils/imageCompression';
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
}

export default function ThreadModal({ post, onClose, adminToken, onAdminDelete }: Props) {
    const [thread, setThread] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [replyImage, setReplyImage] = useState<File | null>(null);
    const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                headers: { 'Content-Type': 'application/json' },
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

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 font-mono text-green-500">
                LOADING THREAD...
            </div>
        );
    }

    if (!thread) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-black w-full max-w-2xl border-2 border-green-600 flex flex-col max-h-[90vh] shadow-[8px_8px_0px_#003300]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b-2 border-green-600 flex justify-between items-center bg-gray-900">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-green-500 font-mono tracking-wider">THREAD #{thread.shortId.slice(0, 8)}</h2>
                        {adminToken && onAdminDelete && (
                            <button
                                onClick={() => {
                                    if (confirm('ADMIN: DELETE THREAD?')) {
                                        onAdminDelete();
                                        onClose();
                                    }
                                }}
                                className="bg-red-600 text-black font-bold px-2 py-0.5 text-xs border border-white hover:bg-red-500 shadow-[2px_2px_0px_white]"
                            >
                                [DELETE]
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} className="text-green-500 hover:text-white font-mono">[X]</button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Main Post */}
                    <div className="bg-black p-4 border border-green-800">
                        {thread.imageUrl && (
                            <img src={thread.imageUrl} alt="" className="max-h-96 w-full object-contain border border-green-900 mb-4 bg-gray-900/50" />
                        )}
                        {thread.text && (
                            <div className="text-green-400 text-lg mb-2 font-mono">
                                <MarkdownContent content={thread.text} />
                            </div>
                        )}
                        <div className="text-xs text-green-700 font-mono mt-2">
                            POSTED {relativeTime(thread.createdAt).toUpperCase()}
                        </div>
                    </div>

                    {/* Replies */}
                    <div className="space-y-2">
                        {thread.replies?.map((reply, i) => (
                            <div key={reply.id} className="bg-black p-3 border-l-4 border-green-700 ml-4">
                                <div className="text-xs text-green-600 mb-1 flex justify-between font-mono">
                                    <span>ANONYMOUS {i + 1}</span>
                                    <span>{relativeTime(reply.createdAt).toUpperCase()}</span>
                                </div>
                                {reply.imageUrl && (
                                    <img src={reply.imageUrl} alt="" className="max-h-64 object-contain mb-2 border border-green-900/50" />
                                )}
                                {reply.text && <div className="text-green-300 font-mono"><MarkdownContent content={reply.text} /></div>}
                            </div>
                        ))}
                        {(!thread.replies || thread.replies.length === 0) && (
                            <p className="text-green-800 text-center py-4 italic font-mono">NO REPLIES YET.</p>
                        )}
                    </div>
                </div>

                {/* Reply Form */}
                <div className="p-4 bg-black border-t-2 border-green-600">
                    <form onSubmit={handleSubmitReply}>
                        {replyImagePreview && (
                            <div className="mb-2 relative inline-block">
                                <img src={replyImagePreview} alt="Preview" className="h-20 border border-green-500" />
                                <button
                                    type="button"
                                    onClick={() => { setReplyImage(null); setReplyImagePreview(null); }}
                                    className="absolute -top-2 -right-2 bg-red-600 text-black font-bold w-5 h-5 flex items-center justify-center text-xs border border-white"
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

                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="REPLY..."
                                className="flex-1 bg-black border border-green-600 px-3 text-green-400 focus:outline-none focus:border-green-400 font-mono placeholder-green-900"
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
            </div>
        </div>
    );
}
