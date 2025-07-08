
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = "antiNews - AI-Curated News Without the Noise",
  description = "Get meaningful news stories curated by AI. Stay informed with breaking news, analysis, and insights from trusted sources worldwide.",
  keywords = "news, breaking news, AI news, curated news, world news, politics, business, technology",
  image = "https://antinews.lovable.app/og-image.png",
  url = "https://antinews.lovable.app/",
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  section
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="antiNews" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Article specific meta tags */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
        </>
      )}
      
      {/* News specific structured data */}
      {type === 'article' && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": title,
            "description": description,
            "image": image,
            "datePublished": publishedTime,
            "dateModified": modifiedTime || publishedTime,
            "author": {
              "@type": "Organization",
              "name": author || "antiNews"
            },
            "publisher": {
              "@type": "Organization",
              "name": "antiNews",
              "logo": {
                "@type": "ImageObject",
                "url": "https://antinews.lovable.app/logo.png"
              }
            }
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
