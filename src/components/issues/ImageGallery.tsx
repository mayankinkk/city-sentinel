import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryImage {
  id: string;
  url: string;
  type: 'reported' | 'resolved' | 'additional';
  caption?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  className?: string;
}

const typeLabels = {
  reported: 'Reported',
  resolved: 'Resolved',
  additional: 'Additional',
};

const typeColors = {
  reported: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-600 border-green-500/20',
  additional: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
        <ImageIcon className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No images available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') setIsOpen(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Image */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="relative group cursor-pointer overflow-hidden rounded-lg">
            <img
              src={images[selectedIndex].url}
              alt={images[selectedIndex].caption || 'Issue image'}
              className="w-full h-64 md:h-80 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "absolute top-3 left-3",
                typeColors[images[selectedIndex].type]
              )}
            >
              {typeLabels[images[selectedIndex].type]}
            </Badge>
            {images.length > 1 && (
              <Badge 
                variant="secondary" 
                className="absolute top-3 right-3"
              >
                {selectedIndex + 1} / {images.length}
              </Badge>
            )}
          </div>
        </DialogTrigger>
        
        <DialogContent 
          className="max-w-4xl p-0 bg-black/95 border-none" 
          onKeyDown={handleKeyDown}
        >
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <img
              src={images[selectedIndex].url}
              alt={images[selectedIndex].caption || 'Issue image'}
              className="w-full max-h-[80vh] object-contain"
            />
            
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <Badge className={typeColors[images[selectedIndex].type]}>
                  {typeLabels[images[selectedIndex].type]}
                </Badge>
                <span className="text-white/80 text-sm">
                  {selectedIndex + 1} / {images.length}
                </span>
              </div>
              {images[selectedIndex].caption && (
                <p className="text-white/90 mt-2 text-sm">
                  {images[selectedIndex].caption}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative flex-shrink-0 rounded-md overflow-hidden transition-all",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                index === selectedIndex
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                className="h-16 w-20 object-cover"
              />
              <div 
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-1",
                  image.type === 'reported' && "bg-yellow-500",
                  image.type === 'resolved' && "bg-green-500",
                  image.type === 'additional' && "bg-blue-500"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
