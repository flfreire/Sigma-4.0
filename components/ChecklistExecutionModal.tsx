import React, { useState, useEffect, useMemo } from 'react';
import { ServiceOrder, Equipment, ChecklistTemplate, ChecklistExecution, ChecklistResultItem, ChecklistItemType, User } from '../types';
import Modal from './Modal';
import { useTranslation } from '../i18n/config';
import { EyeIcon } from './icons';

interface ChecklistExecutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceOrder: ServiceOrder;
    equipment: Equipment;
    checklistTemplates: ChecklistTemplate[];
    currentUser: User;
    readOnly: boolean;
    onSubmit: (execution: Omit<ChecklistExecution, 'id'>, serviceOrder: ServiceOrder) => Promise<void>;
    getExecution: (id: string) => ChecklistExecution | undefined;
    users: User[];
}

const ChecklistExecutionModal: React.FC<ChecklistExecutionModalProps> = ({ isOpen, onClose, serviceOrder, equipment, checklistTemplates, currentUser, readOnly, onSubmit, getExecution, users }) => {
    const { t } = useTranslation();
    const [results, setResults] = useState<Record<string, ChecklistResultItem>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    
    const template = useMemo(() => {
        return checklistTemplates.find(t => t.id === equipment.checklistTemplateId);
    }, [checklistTemplates, equipment.checklistTemplateId]);

    const execution = useMemo(() => {
        return serviceOrder.checklistExecutionId ? getExecution(serviceOrder.checklistExecutionId) : null;
    }, [serviceOrder.checklistExecutionId, getExecution]);

    useEffect(() => {
        if (readOnly && execution) {
            const initialResults = execution.results.reduce((acc, result) => {
                acc[result.checklistItemId] = result;
                return acc;
            }, {} as Record<string, ChecklistResultItem>);
            setResults(initialResults);
        } else if (template) {
            // Initialize results state for a new execution
            const initialResults = template.items.reduce((acc, item) => {
                acc[item.id] = {
                    checklistItemId: item.id,
                    status: null,
                    value: null,
                    notes: '',
                };
                return acc;
            }, {} as Record<string, ChecklistResultItem>);
            setResults(initialResults);
        }
    }, [isOpen, readOnly, execution, template]);

    if (!template) {
        // This should ideally not happen if the button to open the modal is rendered correctly.
        return null;
    }
    
    const handleResultChange = (itemId: string, field: keyof ChecklistResultItem, value: any) => {
        if (readOnly) return;
        setResults(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value,
            }
        }));
    };
    
    const handleSubmit = async () => {
        const executionData: Omit<ChecklistExecution, 'id'> = {
            serviceOrderId: serviceOrder.id,
            equipmentId: equipment.id,
            checklistTemplateId: template.id,
            executionDate: new Date().toISOString().split('T')[0],
            executedByUserId: currentUser.id,
            results: Object.values(results),
        };
        await onSubmit(executionData, serviceOrder);
        onClose();
    };

    const executedByUser = execution ? users.find(u => u.id === execution.executedByUserId) : null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={t('serviceOrders.checklistModalTitle', { equipmentName: equipment.name })}>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                    {readOnly && execution && (
                        <div className="bg-primary p-3 rounded-md border border-accent text-sm mb-4">
                            <p><span className="font-semibold text-highlight">{t('checklistExecution.executionDate')}:</span> {execution.executionDate}</p>
                            <p><span className="font-semibold text-highlight">{t('checklistExecution.executedBy')}:</span> {executedByUser?.name || 'Unknown'}</p>
                        </div>
                    )}
                    {template.items.map(item => {
                        const result = results[item.id];
                        if (!result) return null;
                        const isOk = result.status === 'OK';
                        const isNotOk = result.status === 'NOT_OK';
                        
                        return (
                            <div key={item.id} className="p-3 bg-secondary rounded-lg border border-accent">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold text-light flex-1">{item.order + 1}. {item.text}</p>
                                    {item.photo && (
                                        <button
                                            type="button"
                                            onClick={() => setPreviewImage(item.photo!)}
                                            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-1.5 ml-4 flex-shrink-0"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                            {t('checklists.form.viewExamplePhoto')}
                                        </button>
                                    )}
                                </div>
                                
                                {item.type === ChecklistItemType.OK_NOT_OK && (
                                    <div className="flex gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => handleResultChange(item.id, 'status', 'OK')}
                                            disabled={readOnly}
                                            className={`flex-1 py-2 rounded-md text-white font-bold transition-all ${isOk ? 'bg-green-600 ring-2 ring-green-400' : 'bg-green-800 hover:bg-green-700'} disabled:cursor-not-allowed disabled:opacity-70`}
                                        >{t('checklistExecution.ok')}</button>
                                        <button
                                            type="button"
                                            onClick={() => handleResultChange(item.id, 'status', 'NOT_OK')}
                                            disabled={readOnly}
                                            className={`flex-1 py-2 rounded-md text-white font-bold transition-all ${isNotOk ? 'bg-red-600 ring-2 ring-red-400' : 'bg-red-800 hover:bg-red-700'} disabled:cursor-not-allowed disabled:opacity-70`}
                                        >{t('checklistExecution.notOk')}</button>
                                    </div>
                                )}

                                {item.type === ChecklistItemType.NUMERIC && (
                                    <div className="mb-2">
                                        <label className="block text-sm font-medium text-highlight mb-1">{t('checklistExecution.value')}</label>
                                        <input
                                            type="number"
                                            value={result.value || ''}
                                            onChange={e => handleResultChange(item.id, 'value', e.target.value)}
                                            readOnly={readOnly}
                                            className="w-full bg-primary border-accent rounded-md shadow-sm p-2 text-sm read-only:bg-opacity-50"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-highlight mb-1">{t('checklistExecution.notes')}</label>
                                    <textarea
                                        value={result.notes || ''}
                                        onChange={e => handleResultChange(item.id, 'notes', e.target.value)}
                                        placeholder={t('checklistExecution.notesPlaceholder')}
                                        readOnly={readOnly}
                                        rows={2}
                                        className="w-full bg-primary border-accent rounded-md shadow-sm p-2 text-sm resize-y read-only:bg-opacity-50"
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {!readOnly && (
                        <div className="flex justify-end pt-4">
                            <button 
                                type="button"
                                onClick={handleSubmit}
                                className="bg-brand text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600"
                            >
                                {t('checklistExecution.saveResults')}
                            </button>
                        </div>
                    )}
                </div>
            </Modal>
            
            <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title={t('checklists.form.examplePhotoModalTitle')}>
                {previewImage && <img src={previewImage} alt="Example" className="w-full h-auto rounded-md object-contain max-h-[80vh]" />}
            </Modal>
        </>
    );
};

export default ChecklistExecutionModal;