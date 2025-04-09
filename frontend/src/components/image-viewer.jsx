import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ImageViewer = ({
  isOpen,
  onClose,
  imageUrl,
  className,
  images,
  currentIndex,
  onNavigate,
}) => {
  const hasMultipleImages = images && images.length > 1;

  const handlePrevious = (e) => {
    e.stopPropagation();
    onNavigate(currentIndex - 1);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    onNavigate(currentIndex + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen max-h-screen md:max-w-[90vw] md:max-h-[90vh] p-0 bg-black/90 border-none overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Image Preview</DialogTitle>
        </VisuallyHidden>

        {/* Close button */}
        <Button
          variant="ghost"
          className="absolute right-4 top-4 text-white hover:bg-white/20 z-50"
          onClick={() => onClose(false)}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="relative w-screen h-screen md:w-auto md:h-auto flex items-center justify-center">
          {/* Previous button */}
          {hasMultipleImages && currentIndex > 0 && (
            <Button
              variant="ghost"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          <img
            src={imageUrl}
            alt="Preview"
            className={`w-auto h-auto max-w-[95%] max-h-[95%] object-contain select-none ${className}`}
            draggable="false"
          />

          {/* Next button */}
          {hasMultipleImages && currentIndex < images.length - 1 && (
            <Button
              variant="ghost"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Image counter */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;
