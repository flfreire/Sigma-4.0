
import React, { useState } from 'react';
import { FailureMode } from '../types';
import { useTranslation } from '../i18n/config';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ExclamationTriangleIcon } from './icons';

interface FailureModeFormProps {
    onSubmit: (data: Omit<FailureMode, 'id'> | FailureMode) => Promise<void>;
    onClose: () => void;
    initialData?: FailureMode | null;
}

const FailureModeForm: React.FC<FailureModeFormProps> = ({ onSubmit, onClose, initialData }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        equipmentType: initialData?.equipmentType || 'Machinery',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit = { ...formData };
        if (initialData) {
            await onSubmit({ ...initialData, ...dataToSubmit });
        } else {
            await onSubmit(dataToSubmit);
        }
        onClose();
    };

    const equipmentTypes = ['Machinery', 'Tooling', 'Automation', 'Body in White'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div>
                <label className="block text-sm font-medium text-highlight">{t('failureModes.form.name')}</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-highlight">{t('failureModes.form.description')}</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-highlight">{t('failureModes.form.equipmentType')}</label>
                <select name="equipmentType" value={formData.equipmentType} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                    {equipmentTypes.map(type => (
                        <option key={type} value={type}>{t(`enums.equipmentType.${type}`)}</option>
                    ))}
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('failureModes.form.cancel')}</button>
                <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('failureModes.form.save')}</button>
            </div>
        </form>
    );
};


interface FailureModeListProps {
    failureModes: FailureMode[];
    addFailureMode: (mode: Omit<FailureMode, 'id'>) => Promise<void>;
    updateFailureMode: (mode: FailureMode) => Promise<void>;
    deleteFailureMode: (id: string) => Promise<void>;
}

const FailureModeList: React.FC<FailureModeListProps> = ({ failureModes, addFailureMode, updateFailureMode, deleteFailureMode }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMode, setEditingMode] = useState<FailureMode | null>(null);

    const handleOpenModal = (mode?: FailureMode) => {
        setEditingMode(mode || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMode(null);
    };

    const handleSave = async (data: Omit<FailureMode, 'id'> | FailureMode) => {
        if ('id' in data) {
            await updateFailureMode(data);
        } else {
            await addFailureMode(data);
        }
    };

    const handleDelete = (mode: FailureMode) => {
        if (window.confirm(t('failureModes.deleteConfirm', { name: mode.name }))) {
            deleteFailureMode(mode.id);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-light flex items-center">
                    <ExclamationTriangleIcon className="h-8 w-8 mr-3 text-brand" />
                    {t('failureModes.title')}
                </h2>
                <button onClick={() => handleOpenModal()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t('failureModes.add')}
                </button>
            </div>

            {failureModes.length === 0 ? (
                <div className="text-center py-16 bg-secondary rounded-lg border border-accent">
                    <p className="text-highlight">{t('failureModes.noModes')}</p>
                </div>
            ) : (
                <div className="bg-secondary rounded-lg shadow-md border border-accent overflow-x-auto">
                    <table className="min-w-full divide-y divide-accent">
                        <thead className="bg-primary">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('failureModes.headers.name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('failureModes.headers.description')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('failureModes.headers.equipmentType')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('failureModes.headers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-secondary divide-y divide-accent">
                            {failureModes.map(mode => (
                                <tr key={mode.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-light">{mode.name}</td>
                                    <td className="px-6 py-4 text-sm text-highlight max-w-sm whitespace-normal">{mode.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{t(`enums.equipmentType.${mode.equipmentType}`)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                        <button onClick={() => handleOpenModal(mode)} className="text-brand hover:text-blue-400">{t('failureModes.edit')}</button>
                                        <button onClick={() => handleDelete(mode)} className="text-red-500 hover:text-red-400">{t('failureModes.delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingMode ? t('failureModes.modalEditTitle') : t('failureModes.modalAddTitle')}>
                <FailureModeForm
                    onSubmit={handleSave}
                    onClose={handleCloseModal}
                    initialData={editingMode}
                />
            </Modal>
        </div>
    );
};

export default FailureModeList;
