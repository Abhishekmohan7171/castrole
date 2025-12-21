// --- PostType Enum ---
export enum PostType {
  text = 'text',
  image = 'image',
  video = 'video',
  link = 'link',
  article = 'article',
  ad = 'ad'
}

// --- Discover Interface ---
export interface Discover {
  // --- Basic Post Details ---
  id: string;
  authorId?: string;
  authorName?: string;
  postDate: Date;
  content: string;
  title?: string;
  subtitle?: string;
  description?: string; // Alternative to content
  imageUrl?: string;
  videoUrl?: string;
  fileUrl?: string; // Generic file URL
  customUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];

  // --- Media & Type ---
  type: PostType;
  isFeatured: boolean;

  // --- Metadata ---
  location?: string;
  metadata?: Map<string, any>; // for flexible future data
  isActive: boolean;

  // --- System Fields ---
  createdAt: Date;
  updatedAt: Date;
  expiryDate?: Date;
}
