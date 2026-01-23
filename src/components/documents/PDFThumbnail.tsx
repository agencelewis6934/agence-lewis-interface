import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFThumbnailProps {
    url: string;
    className?: string;
}

export function PDFThumbnail({ url, className = '' }: PDFThumbnailProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [error, setError] = useState(false);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setError(false);
    }

    function onDocumentLoadError(error: Error) {
        console.error('Error loading PDF:', error);
        setError(true);
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center ${className}`}>
                <div className="text-center">
                    <div className="text-red-500 text-4xl mb-2">📄</div>
                    <div className="text-xs text-gray-400">PDF</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                    <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                }
            >
                <Page
                    pageNumber={1}
                    width={300}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="pdf-thumbnail"
                />
            </Document>
        </div>
    );
}
