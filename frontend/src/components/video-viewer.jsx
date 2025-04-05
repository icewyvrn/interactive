import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VideoViewer = ({ isOpen, onClose, videoUrl }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[600px] p-0 bg-black/90 border-none overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Video Preview</DialogTitle>
        </VisuallyHidden>

        {/* Close button */}
        <Button
          variant="ghost"
          className="absolute right-4 top-4 text-white hover:bg-white/20 z-50"
          onClick={() => onClose(false)}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="relative flex items-center justify-center p-4">
          <video
            src={videoUrl}
            controls
            className="w-full h-full max-w-[720px] max-h-[480px] object-contain"
            autoPlay
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoViewer;
