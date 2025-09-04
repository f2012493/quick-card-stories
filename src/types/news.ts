interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  author: string;
  imageUrl: string;
  readTime: string;
  publishedAt?: string;
  sourceUrl?: string;
}

export type { NewsItem };