import React, { useState, useEffect } from 'react';
import { Partner, PartnerType } from '../types';
import { useTranslation } from '../i18n/config';
import Modal from './Modal';
import { PlusIcon, TrashIcon, TruckIcon } from './icons';
import { geocode, searchAddress, AddressSuggestion } from '../services/geocodingService';
import PartnerMap from './PartnerMap';

interface PartnerFormProps {
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
  initialData?: Partner | null;
}

const PartnerForm: React.FC<PartnerFormProps> = ({ onSubmit, onClose, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || PartnerType.Supplier,
    contactPerson: initialData?.contactPerson || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    latitude: initialData?.latitude,
    longitude: initialData?.longitude,
  });
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    // Don't search if the address is the same as the initial one (avoids search on modal open)
    if (formData.address === initialData?.address) {
        setSuggestions([]);
        return;
    }
    const handler = setTimeout(() => {
        if (formData.address && formData.address.length > 2) {
            setIsSearching(true);
            searchAddress(formData.address).then(results => {
                setSuggestions(results);
                setIsSearching(false);
            });
        } else {
            setSuggestions([]);
        }
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [formData.address, initialData?.address]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        // If user is typing in address, invalidate previous coordinates
        ...(name === 'address' && { latitude: undefined, longitude: undefined })
    }));
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setFormData(prev => ({
        ...prev,
        address: suggestion.display_name,
        latitude: parseFloat(suggestion.lat),
        longitude: parseFloat(suggestion.lon),
    }));
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let dataToSubmit = { ...formData };
    
    // If address was typed but no suggestion was selected, try to geocode one last time.
    if (dataToSubmit.address && dataToSubmit.latitude === undefined && dataToSubmit.address !== initialData?.address) {
        const coords = await geocode(dataToSubmit.address);
        if (coords) {
            dataToSubmit.latitude = coords.lat;
            dataToSubmit.longitude = coords.lon;
        } else {
             alert(t('partners.map.addressError'));
        }
    }

    await onSubmit({ ...initialData, ...dataToSubmit });
    onClose();
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-highlight">{t('partners.form.name')}</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
        </div>
        <div>
            <label className="block text-sm font-medium text-highlight">{t('partners.form.type')}</label>
            <select name="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                {Object.values(PartnerType).map(type => (
                    <option key={type} value={type}>{t(`enums.partnerType.${type}`)}</option>
                ))}
            </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-highlight">{t('partners.form.contactPerson')}</label>
          <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-highlight">{t('partners.form.phone')}</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-highlight">{t('partners.form.email')}</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
      </div>
      <div>
        <label htmlFor="address-input" className="block text-sm font-medium text-highlight">{t('partners.form.address')}</label>
        <div className="relative mt-1">
            <input
                id="address-input"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="block w-full bg-primary border-accent rounded-md shadow-sm p-2 pr-10"
                autoComplete="off"
            />
            {isSearching && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                     <svg className="animate-spin h-5 w-5 text-highlight" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                </div>
            )}
            {suggestions.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-secondary border border-accent rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((s, index) => (
                        <li key={index}
                            onClick={() => handleSelectSuggestion(s)}
                            onMouseDown={(e) => e.preventDefault()} // Prevents input blur on click
                            className="cursor-pointer select-none relative py-2 px-4 text-light hover:bg-accent"
                        >
                            <span className="block truncate text-sm">{s.display_name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('equipment.form.cancel')}</button>
        <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('equipment.form.save')}</button>
      </div>
    </form>
  );
};


interface PartnerListProps {
  partners: Partner[];
  addPartner: (item: Omit<Partner, 'id'>) => Promise<void>;
  updatePartner: (item: Partner) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
}

const PartnerList: React.FC<PartnerListProps> = ({ partners, addPartner, updatePartner, deletePartner }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');

  const handleOpenModal = (item?: Partner) => {
    setEditingPartner(item || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
  };

  const handleSave = async (data: any) => {
    if (editingPartner) {
      await updatePartner(data);
    } else {
      await addPartner(data);
    }
    handleCloseModal();
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm(t('partners.deleteConfirm'))) {
        deletePartner(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-light flex items-center">
            <TruckIcon className="h-8 w-8 mr-3 text-brand" />
            {t('partners.title')}
        </h2>
        <button onClick={() => handleOpenModal()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('partners.add')}
        </button>
      </div>

      <div className="border-b border-accent mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setView('list')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              view === 'list'
                ? 'border-brand text-brand'
                : 'border-transparent text-highlight hover:text-light hover:border-gray-500'
            }`}
          >
            {t('partners.viewTabs.list')}
          </button>
           <button
            onClick={() => setView('map')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              view === 'map'
                ? 'border-brand text-brand'
                : 'border-transparent text-highlight hover:text-light hover:border-gray-500'
            }`}
          >
            {t('partners.viewTabs.map')}
          </button>
        </nav>
      </div>

      {view === 'list' ? (
        <div className="bg-secondary rounded-lg shadow-md border border-accent overflow-x-auto">
          <table className="min-w-full divide-y divide-accent">
            <thead className="bg-primary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('partners.headers.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('partners.headers.type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('partners.headers.contactPerson')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('partners.headers.phone')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('partners.headers.email')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('partners.headers.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-secondary divide-y divide-accent">
              {partners.map(partner => (
                <tr key={partner.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light font-semibold">{partner.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{t(`enums.partnerType.${partner.type}`)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{partner.contactPerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{partner.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{partner.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button onClick={() => handleOpenModal(partner)} className="text-brand hover:text-blue-400">{t('partners.edit')}</button>
                    <button onClick={() => handleDelete(partner.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-4 w-4 inline"/></button>
                  </td>
                </tr>
              ))}
              {partners.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-highlight">
                          {t('partners.noPartners')}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <PartnerMap partners={partners} />
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPartner ? t('partners.modalEditTitle') : t('partners.modalAddTitle')}>
        <PartnerForm onSubmit={handleSave} onClose={handleCloseModal} initialData={editingPartner} />
      </Modal>
    </div>
  );
};

export default PartnerList;