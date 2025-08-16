import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Modal from './Modal';
import { useTranslation } from '../i18n/config';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}

const qrCodeRegionId = "qr-code-full-region";

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    const { t } = useTranslation();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const html5QrCode = new Html5Qrcode(qrCodeRegionId);
        let isCleaningUp = false;

        const startScanner = async () => {
            setErrorMessage(null);
            try {
                // Ensure the element is in the DOM
                if (!document.getElementById(qrCodeRegionId)) {
                    console.error(`Element with id ${qrCodeRegionId} not found.`);
                    return;
                }

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                            const qrboxSize = Math.floor(minEdge * 0.7);
                            return { width: qrboxSize, height: qrboxSize };
                        },
                        aspectRatio: 1.0,
                    },
                    (decodedText, _) => {
                         if (!isCleaningUp) {
                            onScanSuccess(decodedText);
                            handleClose();
                        }
                    },
                    (error) => {
                       // This callback is for scan errors, not critical failures.
                       // We can ignore it to avoid console spam on non-QR images.
                    }
                );
            } catch (err: any) {
                console.error("Failed to start QR scanner:", err);
                if (err.name === "NotAllowedError") {
                   setErrorMessage(t('scanner.error.camera'));
                } else {
                   setErrorMessage(err.message || 'Failed to start camera.');
                }
            }
        };

        const handleClose = async () => {
            if (isCleaningUp) return;
            isCleaningUp = true;
            try {
                if (html5QrCode && html5QrCode.isScanning) {
                    await html5QrCode.stop();
                }
            } catch (err) {
                console.warn("Could not stop QR scanner cleanly:", err);
            } finally {
                onClose();
            }
        };

        const timer = setTimeout(startScanner, 100); // Small delay to ensure modal is rendered
        
        return () => {
            clearTimeout(timer);
            handleClose();
        };
    }, [isOpen, onScanSuccess, onClose, t]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('scanner.title')}>
            <div className="w-full max-w-md mx-auto">
                <div id={qrCodeRegionId} className="w-full aspect-square border-4 border-accent rounded-lg bg-black overflow-hidden"></div>
                {errorMessage && <p className="text-red-500 text-center mt-4">{errorMessage}</p>}
                {!errorMessage && <p className="text-highlight text-center mt-4">{t('scanner.description')}</p>}
            </div>
        </Modal>
    );
};

export default QRScannerModal;