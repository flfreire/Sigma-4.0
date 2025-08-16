import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Equipment } from '../types';
import { XMarkIcon } from './icons';
import { useTranslation } from '../i18n/config';
import Modal from './Modal';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipment: Equipment | null;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, equipment }) => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && equipment && canvasRef.current) {
            // Encode only the ID for robustness. The app will fetch details using this ID.
            const dataToEncode = JSON.stringify({ id: equipment.id });
            QRCode.toCanvas(canvasRef.current, dataToEncode, { width: 256, errorCorrectionLevel: 'H' }, (error) => {
                if (error) console.error(error);
            });
        }
    }, [isOpen, equipment]);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body * {
                    visibility: hidden;
                }
                .print-container, .print-container * {
                    visibility: visible;
                }
                .print-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                 .print-header {
                    font-family: sans-serif;
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-bottom: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    if (!isOpen || !equipment) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('equipment.modalQrTitle', { name: equipment.name })}>
             <div className="flex flex-col items-center p-4">
                <div ref={printRef}>
                    <div className="print-container">
                        <h3 className="print-header text-lg font-bold text-light mb-4">{equipment.name}</h3>
                        <canvas ref={canvasRef} />
                        <p className="text-sm text-highlight mt-2">{equipment.id}</p>
                    </div>
                </div>
                <button
                    onClick={handlePrint}
                    className="mt-6 bg-brand text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600 transition-colors"
                >
                    {t('equipment.print')}
                </button>
            </div>
        </Modal>
    );
};

export default QRCodeModal;
