import React, { useState } from 'react';
import { ChecklistTemplate, ChecklistItem, ChecklistItemType, UserRole } from '../types';
import { useTranslation } from '../i18n/config';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ClipboardDocumentCheckIcon, XMarkIcon, PhotoIcon } from './icons';

interface ChecklistTemplateFormProps {
    onSubmit: (data: Omit<ChecklistTemplate, 'id' | 'type'> | Omit<ChecklistTemplate, 'type'>) => Promise<void>;
    onClose: () => void;
    initialData?: ChecklistTemplate | null;
}

const ChecklistTemplateForm: React.FC<ChecklistTemplateFormProps> = ({ onSubmit, onClose, initialData }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(initialData?.name || '');
    const [items, setItems] = useState<ChecklistItem[]>(initialData?.items || []);

    const handleItemChange = (index: number, field: 'text' | 'type', value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert(t('equipment.form.fileSizeError')); return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const newItems = [...items];
                newItems[index] = { ...newItems[index], photo: base64String };
                setItems(newItems);
            };
            reader.readAsDataURL(file);
            e.target.value = "";
        }
    };
    
    const handleRemovePhoto = (index: number) => {
        const newItems = [...items];
        delete newItems[index].photo;
        setItems(newItems);
    };

    const handleAddItem = () => {
        const newItem: ChecklistItem = {
            id: `item-${Date.now()}`,
            text: '',
            type: ChecklistItemType.OK_NOT_OK,
            order: items.length,
        };
        setItems([...items, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const templateData = {
            name,
            items: items.map((item, index) => ({ ...item, order: index })), // Re-order on save
        };
        if (initialData) {
            await onSubmit({ ...initialData, ...templateData });
        } else {
            await onSubmit(templateData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div>
                <label className="block text-sm font-medium text-highlight">{t('checklists.form.name')}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
            </div>
            <div>
                <h4 className="text-lg font-semibold text-light mb-2">{t('checklists.form.itemsTitle')}</h4>
                <div className="space-y-3 p-3 bg-primary rounded-md border border-accent">
                    {items.map((item, index) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 bg-secondary rounded-md">
                            <span className="font-bold text-highlight pt-2">{index + 1}.</span>
                            <div className="flex-grow space-y-2">
                                <input
                                    type="text"
                                    placeholder={t('checklists.form.itemText')}
                                    value={item.text}
                                    onChange={e => handleItemChange(index, 'text', e.target.value)}
                                    required
                                    className="w-full bg-primary border-accent rounded-md shadow-sm p-2 text-sm"
                                />
                                <select
                                    value={item.type}
                                    onChange={e => handleItemChange(index, 'type', e.target.value)}
                                    className="w-full bg-primary border-accent rounded-md shadow-sm p-2 text-sm"
                                >
                                    {Object.values(ChecklistItemType).map(type => (
                                        <option key={type} value={type}>{t(`enums.checklistItemType.${type}`)}</option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-2 pt-2">
                                    {item.photo ? (
                                        <div className="flex items-center gap-2">
                                            <img src={item.photo} alt="Preview" className="h-14 w-14 object-cover rounded-md border-2 border-accent" />
                                            <button type="button" onClick={() => handleRemovePhoto(index)} className="text-red-500 hover:text-red-400 text-sm font-semibold flex items-center gap-1">
                                                <TrashIcon className="h-4 w-4" /> {t('checklists.form.removePhoto')}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <label htmlFor={`photo-upload-${item.id}`} className="cursor-pointer text-brand hover:text-blue-400 text-sm font-semibold flex items-center gap-1">
                                                <PhotoIcon className="h-4 w-4" /> {t('checklists.form.addPhoto')}
                                            </label>
                                            <input id={`photo-upload-${item.id}`} type="file" onChange={(e) => handlePhotoUpload(e, index)} className="hidden" accept="image/png, image/jpeg" />
                                        </>
                                    )}
                                </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 p-2 mt-1">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddItem} className="w-full mt-3 bg-accent text-light font-bold py-2 px-4 rounded-md hover:bg-highlight flex items-center justify-center">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        {t('checklists.form.addItem')}
                    </button>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('checklists.form.cancel')}</button>
                <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('checklists.form.save')}</button>
            </div>
        </form>
    );
};

interface ChecklistTemplatesProps {
    templates: ChecklistTemplate[];
    addTemplate: (template: Omit<ChecklistTemplate, 'id'>) => Promise<void>;
    updateTemplate: (template: ChecklistTemplate) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
    type: 'equipment' | 'metrology';
}

const ChecklistTemplates: React.FC<ChecklistTemplatesProps> = ({ templates, addTemplate, updateTemplate, deleteTemplate, type }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);

    const canManage = user?.role === UserRole.Admin || user?.role === UserRole.Manager;

    const relevantTemplates = templates.filter(t => t.type === type || (type === 'equipment' && !t.type));

    const handleOpenModal = (template?: ChecklistTemplate) => {
        if (!canManage) return;
        setEditingTemplate(template || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleSave = async (data: Omit<ChecklistTemplate, 'id' | 'type'> | Omit<ChecklistTemplate, 'type'>) => {
        if ('id' in data) {
            await updateTemplate({ ...(data as ChecklistTemplate), type });
        } else {
            await addTemplate({ ...(data as Omit<ChecklistTemplate, 'id' | 'type'>), type });
        }
    };

    const handleDelete = (template: ChecklistTemplate) => {
        if (!canManage) return;
        if (window.confirm(t('checklists.deleteConfirm', { name: template.name }))) {
            deleteTemplate(template.id);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-light flex items-center">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 mr-3 text-brand" />
                    {type === 'equipment' ? t('checklists.title') : t('checklists.metrologyTitle')}
                </h3>
                {canManage && (
                    <button onClick={() => handleOpenModal()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        {t('checklists.add')}
                    </button>
                )}
            </div>

            {relevantTemplates.length === 0 ? (
                <div className="text-center py-16 bg-secondary rounded-lg border border-accent">
                    <p className="text-highlight">{t('checklists.noTemplates')}</p>
                </div>
            ) : (
                <div className="bg-secondary rounded-lg shadow-md border border-accent overflow-hidden">
                    <ul className="divide-y divide-accent">
                        {relevantTemplates.map(template => (
                            <li key={template.id} className="p-4 flex justify-between items-center hover:bg-primary transition-colors">
                                <div>
                                    <p className="font-semibold text-light text-lg">{template.name}</p>
                                    <p className="text-sm text-highlight">{template.items.length} items</p>
                                </div>
                                {canManage && (
                                    <div className="space-x-4">
                                        <button onClick={() => handleOpenModal(template)} className="text-brand hover:text-blue-400 font-medium">{t('checklists.edit')}</button>
                                        <button onClick={() => handleDelete(template)} className="text-red-500 hover:text-red-400 font-medium">{t('checklists.delete')}</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {canManage && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTemplate ? t('checklists.modalEditTitle') : t('checklists.modalAddTitle')}>
                    <ChecklistTemplateForm
                        onSubmit={handleSave}
                        onClose={handleCloseModal}
                        initialData={editingTemplate}
                    />
                </Modal>
            )}
        </>
    );
};

export default ChecklistTemplates;