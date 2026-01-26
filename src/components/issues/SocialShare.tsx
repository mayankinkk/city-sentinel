import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Link2, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SocialShareProps {
  issueId: string;
  title: string;
}

export function SocialShare({ issueId, title }: SocialShareProps) {
  const { t } = useTranslation();
  
  const shareUrl = `${window.location.origin}/issues/${issueId}`;
  const shareText = `Check out this issue: ${title}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('share.linkCopied'));
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Use native share if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error - fail silently
      }
    }
  };

  // Check if native share is supported
  const hasNativeShare = typeof navigator.share === 'function';

  if (hasNativeShare) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={handleNativeShare}
      >
        <Share2 className="h-4 w-4" />
        {t('share.shareIssue')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          {t('share.shareIssue')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyLink} className="gap-2 cursor-pointer">
          <Link2 className="h-4 w-4" />
          {t('share.copyLink')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareOnTwitter} className="gap-2 cursor-pointer">
          <Twitter className="h-4 w-4" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareOnFacebook} className="gap-2 cursor-pointer">
          <Facebook className="h-4 w-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareOnWhatsApp} className="gap-2 cursor-pointer">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
