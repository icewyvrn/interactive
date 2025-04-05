import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ImageViewer = ({ isOpen, onClose, imageUrl, className }) => {
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
          <img
            src={imageUrl}
            alt="Preview"
            className={`w-auto h-auto max-w-[95%] max-h-[95%] object-contain select-none ${className}`}
            draggable="false"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;
