
import React, { useState } from 'react';
import { Supplier } from '../types';
import { useTranslation } from '../i18n/config';
import Modal from './Modal';
import { PlusIcon, TrashIcon, TruckIcon } from './icons';

interface SupplierFormProps {
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
  initialData?: Supplier | null;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ onSubmit, onClose, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    contactPerson: initialData?.contactPerson || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...initialData, ...formData });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div>
        <label className="block text-sm font-medium text-highlight">{t('suppliers.form.name')}</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-highlight">{t('suppliers.form.contactPerson')}</label>
          <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-highlight">{t('suppliers.form.phone')}</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-highlight">{t('suppliers.form.email')}</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-highlight">{t('suppliers.form.address')}</label>
        <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('equipment.form.cancel')}</button>
        <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('equipment.form.save')}</button>
      </div>
    </form>
  );
};


interface SupplierListProps {
  suppliers: Supplier[];
  addSupplier: (item: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (item: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
}

const SupplierList: React.FC<SupplierListProps> = ({ suppliers, addSupplier, updateSupplier, deleteSupplier }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const handleOpenModal = (item?: Supplier) => {
    setEditingSupplier(item || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSave = async (data: any) => {
    if (editingSupplier) {
      await updateSupplier(data);
    } else {
      await addSupplier(data);
    }
    handleCloseModal();
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm(t('suppliers.deleteConfirm'))) {
        deleteSupplier(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-light flex items-center">
            <TruckIcon className="h-8 w-8 mr-3 text-brand" />
            {t('suppliers.title')}
        </h2>
        <button onClick={() => handleOpenModal()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('suppliers.add')}
        </button>
      </div>
      <div className="bg-secondary rounded-lg shadow-md border border-accent overflow-x-auto">
        <table className="min-w-full divide-y divide-accent">
          <thead className="bg-primary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('suppliers.headers.name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('suppliers.headers.contactPerson')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('suppliers.headers.phone')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('suppliers.headers.email')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('suppliers.headers.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-secondary divide-y divide-accent">
            {suppliers.map(supplier => (
              <tr key={supplier.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-light font-semibold">{supplier.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{supplier.contactPerson}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{supplier.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{supplier.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                  <button onClick={() => handleOpenModal(supplier)} className="text-brand hover:text-blue-400">{t('suppliers.edit')}</button>
                  <button onClick={() => handleDelete(supplier.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-4 w-4 inline"/></button>
                </td>
              </tr>
            ))}
             {suppliers.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-highlight">
                        {t('suppliers.noSuppliers')}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSupplier ? t('suppliers.modalEditTitle') : t('suppliers.modalAddTitle')}>
        <SupplierForm onSubmit={handleSave} onClose={handleCloseModal} initialData={editingSupplier} />
      </Modal>
    </div>
  );
};

export default SupplierList;
