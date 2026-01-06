import { z } from 'zod';

export const createPostSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  text: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isNSFW: z.boolean().optional(),
}).refine(data => data.text || data.imageUrl, {
  message: 'Either text or image must be provided',
});

export const createReplySchema = z.object({
  text: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isNSFW: z.boolean().optional(),
}).refine(data => data.text || data.imageUrl, {
  message: 'Either text or image must be provided',
});

export const getPostsSchema = z.object({
  minX: z.number().finite(),
  maxX: z.number().finite(),
  minY: z.number().finite(),
  maxY: z.number().finite(),
});

export const reportSchema = z.object({
  targetType: z.enum(['post', 'reply']),
  targetId: z.string(),
  reason: z.string().max(500).optional(),
});

export const deleteSchema = z.object({
  targetType: z.enum(['post', 'reply']),
  targetId: z.string(),
  deleteToken: z.string(),
});
