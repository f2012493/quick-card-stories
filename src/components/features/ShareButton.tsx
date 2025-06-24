
import React from 'react';
import { Share2, Copy, Twitter, Facebook } from 'lucide-react';
import { toast } from 'sonner';

interface NewsItem {
  id: string;
  headline: string;
  tldr: string;
  sourceUrl?: string;
}

interface ShareButtonProps {
  article: NewsItem;
}

const ShareButton = ({ article }: ShareButtonProps) => {
  const [showOptions, setShowOptions] = React.useState(false);

  const shareUrl = article.sourceUrl || window.location.href;
  const shareText = `${article.headline} - ${article.tldr}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
      setShowOptions(false);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    setShowOptions(false);
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    setShowOptions(false);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.headline,
          text: article.tldr,
          url: shareUrl,
        });
        setShowOptions(false);
      } catch (error) {
        console.log('Native share cancelled');
      }
    } else {
      setShowOptions(!showOptions);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={nativeShare}
        className="p-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors border border-white/20"
        title="Share article"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {showOptions && (
        <div className="absolute bottom-12 left-0 bg-black/90 backdrop-blur-sm rounded-lg p-2 border border-white/20 flex space-x-2">
          <button
            onClick={copyLink}
            className="p-2 text-white hover:bg-white/10 rounded"
            title="Copy link"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={shareOnTwitter}
            className="p-2 text-white hover:bg-white/10 rounded"
            title="Share on Twitter"
          >
            <Twitter className="w-4 h-4" />
          </button>
          <button
            onClick={shareOnFacebook}
            className="p-2 text-white hover:bg-white/10 rounded"
            title="Share on Facebook"
          >
            <Facebook className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
