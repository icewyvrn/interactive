import { pdfjs } from 'react-pdf';

// Initialize PDF.js worker
const initPdfWorker = () => {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
};

export default initPdfWorker;
