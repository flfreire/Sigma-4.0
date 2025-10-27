
import React, { useState } from 'react';
import { ServiceCategory } from '../types';
import { useTranslation } from '../i18n/config';
import Modal from './Modal';
import { PlusIcon, BuildingStorefrontIcon } from './icons';

interface ServiceCategoryFormProps {
    onSubmit: (data: Omit<ServiceCategory, 'id'> | ServiceCategory) => Promise<void>;
    onClose: () => void;
    initialData?: ServiceCategory | null;
}

const ServiceCategoryForm: React.FC<ServiceCategoryFormProps> = ({ onSubmit, onClose, initialData }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(initialData?.name || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name };
        if (initialData) {
            await onSubmit({ ...initialData, ...data });
        } else {
            await onSubmit(data);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-highlight">{t('serviceCategories.form.name')}</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2"
                />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('serviceCategories.form.cancel')}</button>
                <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('serviceCategories.form.save')}</button>
            </div>
        </form>
    );
};

interface ServiceCategoryListProps {
    serviceCategories: ServiceCategory[];
    addServiceCategory: (category: Omit<ServiceCategory, 'id'>) => Promise<void>;
    updateServiceCategory: (category: ServiceCategory) => Promise<void>;
    deleteServiceCategory: (id: string) => Promise<void>;
}

const ServiceCategoryList: React.FC<ServiceCategoryListProps> = ({ serviceCategories, addServiceCategory, updateServiceCategory, deleteServiceCategory }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);

    const handleOpenModal = (category?: ServiceCategory) => {
        setEditingCategory(category || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSave = async (data: Omit<ServiceCategory, 'id'> | ServiceCategory) => {
        if ('id' in data) {
            await updateServiceCategory(data);
        } else {
            await addServiceCategory(data);
        }
    };

    const handleDelete = (category: ServiceCategory) => {
        if (window.confirm(t('serviceCategories.deleteConfirm', { name: category.name }))) {
            deleteServiceCategory(category.id);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-light flex items-center">
                    <BuildingStorefrontIcon className="h-8 w-8 mr-3 text-brand" />
                    {t('serviceCategories.title')}
                </h2>
                <button onClick={() => handleOpenModal()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t('serviceCategories.add')}
                </button>
            </div>

            {serviceCategories.length === 0 ? (
                <div className="text-center py-16 bg-secondary rounded-lg border border-accent">
                    <p className="text-highlight">{t('serviceCategories.noCategories')}</p>
                </div>
            ) : (
                <div className="bg-secondary rounded-lg shadow-md border border-accent overflow-hidden">
                    <ul className="divide-y divide-accent">
                        {serviceCategories.map(category => (
                            <li key={category.id} className="p-4 flex justify-between items-center hover:bg-primary transition-colors">
                                <p className="font-semibold text-light text-lg">{category.name}</p>
                                <div className="space-x-4">
                                    <button onClick={() => handleOpenModal(category)} className="text-brand hover:text-blue-400 font-medium">{t('serviceCategories.edit')}</button>
                                    <button onClick={() => handleDelete(category)} className="text-red-500 hover:text-red-400 font-medium">{t('serviceCategories.delete')}</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCategory ? t('serviceCategories.modalEditTitle') : t('serviceCategories.modalAddTitle')}>
                <ServiceCategoryForm
                    onSubmit={handleSave}
                    onClose={handleCloseModal}
                    initialData={editingCategory}
                />
            </Modal>
        </div>
    );
};

export default ServiceCategoryList;
