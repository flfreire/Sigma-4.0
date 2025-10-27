
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Partner, PartnerType, ServiceCategory, Quote, User } from '../types';
import { useTranslation } from '../i18n/config';
import Modal from './Modal';
import { PlusIcon, TrashIcon, TruckIcon } from './icons';
import { geocode, searchAddress, AddressSuggestion } from '../services/geocodingService';
import PartnerMap from './PartnerMap';
import ServiceCategoryList from './ServiceCategoryList';
import QuoteList from './QuoteList';

interface PartnerFormProps {
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
  initialData?: Partner | null;
  serviceCategories: ServiceCategory[];
  addServiceCategory: (category: Omit<ServiceCategory, 'id'>) => Promise<void>;
}

const PartnerForm: React.FC<PartnerFormProps> = ({ onSubmit, onClose, initialData, serviceCategories, addServiceCategory }) => {
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
    serviceCategoryIds: initialData?.serviceCategoryIds || [],
    notes: initialData?.notes || '',
  });
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // New states for dropdown and modal
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Debounced address search effect
  useEffect(() => {
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
    }, 500);
    return () => clearTimeout(handler);
  }, [formData.address, initialData?.address]);

  // Click outside handler for category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        ...(name === 'address' && { latitude: undefined, longitude: undefined })
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => {
        const currentIds = prev.serviceCategoryIds || [];
        const newIds = currentIds.includes(categoryId)
            ? currentIds.filter(id => id !== categoryId)
            : [...currentIds, categoryId];
        return { ...prev, serviceCategoryIds: newIds };
    });
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

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
        await addServiceCategory({ name: newCategoryName.trim() });
        setNewCategoryName('');
        setIsAddCategoryModalOpen(false);
    }
  };

  const selectedCategoryNames = useMemo(() => {
    return (formData.serviceCategoryIds || [])
        .map(id => serviceCategories.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');
  }, [formData.serviceCategoryIds, serviceCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let dataToSubmit = { ...formData };
    
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
    <>
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
        <div>
            <label className="block text-sm font-medium text-highlight">{t('partners.form.serviceCategories')}</label>
            <div className="relative mt-1" ref={categoryDropdownRef}>
                <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                className="relative w-full cursor-default rounded-md border border-accent bg-primary py-2 pl-3 pr-10 text-left shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand sm:text-sm h-10"
                >
                <span className="block truncate text-light pr-8">
                    {selectedCategoryNames || t('partners.form.selectCategoriesPlaceholder')}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </span>
                </button>
                {isCategoryDropdownOpen && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <div className="max-h-48 overflow-y-auto">
                        {serviceCategories.map(cat => (
                            <label key={cat.id} className="flex items-center space-x-3 py-2 px-3 text-light hover:bg-accent cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.serviceCategoryIds?.includes(cat.id)}
                                    onChange={() => handleCategoryChange(cat.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                                />
                                <span>{cat.name}</span>
                            </label>
                        ))}
                    </div>
                    <div 
                        onClick={() => {
                            setIsCategoryDropdownOpen(false);
                            setIsAddCategoryModalOpen(true);
                        }}
                        className="flex items-center space-x-2 py-2 px-3 text-brand hover:bg-accent cursor-pointer border-t border-accent mt-1"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>{t('partners.form.addCategory')}</span>
                    </div>
                </div>
                )}
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
                              onMouseDown={(e) => e.preventDefault()}
                              className="cursor-pointer select-none relative py-2 px-4 text-light hover:bg-accent"
                          >
                              <span className="block truncate text-sm">{s.display_name}</span>
                          </li>
                      ))}
                  </ul>
              )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-highlight">{t('partners.form.notes')}</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder={t('partners.form.notesPlaceholder')}
            className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('equipment.form.cancel')}</button>
          <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('equipment.form.save')}</button>
        </div>
      </form>

      <Modal 
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          title={t('serviceCategories.modalAddTitle')}
      >
          <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-highlight">{t('serviceCategories.form.name')}</label>
                  <input
                      type="text"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      required
                      className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2"
                      autoFocus
                  />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setIsAddCategoryModalOpen(false)} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('serviceCategories.form.cancel')}</button>
                  <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('serviceCategories.form.save')}</button>
              </div>
          </form>
      </Modal>
    </>
  );
};

interface PartnerListProps {
  partners: Partner[];
  addPartner: (item: Omit<Partner, 'id'>) => Promise<void>;
  updatePartner: (item: Partner) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  serviceCategories: ServiceCategory[];
  addServiceCategory: (category: Omit<ServiceCategory, 'id'>) => Promise<void>;
  updateServiceCategory: (category: ServiceCategory) => Promise<void>;
  deleteServiceCategory: (id: string) => Promise<void>;
  quotes: Quote[];
  currentUser: User;
  addQuote: (item: Omit<Quote, 'id'>) => Promise<void>;
  updateQuote: (item: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
}

const PartnersView: React.FC<{
  partners: Partner[],
  serviceCategories: ServiceCategory[],
  handleOpenPartnerModal: (partner?: Partner) => void,
  handleDeletePartner: (id: string) => void,
}> = ({ partners, serviceCategories, handleOpenPartnerModal, handleDeletePartner }) => {
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [typeFilter, setTypeFilter] = useState<'All' | PartnerType>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
        const typeMatch = typeFilter === 'All' || partner.type === typeFilter;
        const categoryMatch = categoryFilter === 'All' || (partner.serviceCategoryIds || []).includes(categoryFilter);
        return typeMatch && categoryMatch;
    });
  }, [partners, typeFilter, categoryFilter]);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
          <div className="border-b border-accent">
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
          <button onClick={() => handleOpenPartnerModal()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('partners.add')}
          </button>
      </div>

      {view === 'list' ? (
        <>
        <div className="bg-secondary p-4 rounded-lg shadow-md border border-accent mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
                <label className="font-semibold text-highlight text-sm">{t('partners.map.filterByType')}</label>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="bg-primary border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand">
                    <option value="All">{t('partners.map.all')}</option>
                    <option value={PartnerType.Supplier}>{t(`enums.partnerType.${PartnerType.Supplier}`)}</option>
                    <option value={PartnerType.ServiceProvider}>{t(`enums.partnerType.${PartnerType.ServiceProvider}`)}</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <label className="font-semibold text-highlight text-sm">{t('partners.map.filterByCategory')}</label>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-primary border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand">
                    <option value="All">{t('partners.map.all')}</option>
                    {serviceCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
        </div>
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
              {filteredPartners.map(partner => (
                <tr key={partner.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light font-semibold">{partner.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{t(`enums.partnerType.${partner.type}`)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{partner.contactPerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{partner.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{partner.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button onClick={() => handleOpenPartnerModal(partner)} className="text-brand hover:text-blue-400">{t('partners.edit')}</button>
                    <button onClick={() => handleDeletePartner(partner.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-4 w-4 inline"/></button>
                  </td>
                </tr>
              ))}
              {filteredPartners.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-highlight">
                          {t('partners.noPartners')}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <PartnerMap partners={partners} serviceCategories={serviceCategories} />
      )}
    </>
  );
};

const PartnerList: React.FC<PartnerListProps> = (props) => {
  const { partners, addPartner, updatePartner, deletePartner, serviceCategories, addServiceCategory, updateServiceCategory, deleteServiceCategory, quotes, currentUser, addQuote, updateQuote, deleteQuote } = props;
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [activeView, setActiveView] = useState<'partners' | 'categories' | 'quotes'>('partners');
  
  const TABS_VIEWS = [
      { key: 'partners', label: t('partners.tabs.partners') },
      { key: 'categories', label: t('partners.tabs.categories') },
      { key: 'quotes', label: t('partners.tabs.quotes') },
  ];

  const handleOpenPartnerModal = (item?: Partner) => {
    setEditingPartner(item || null);
    setIsModalOpen(true);
  };

  const handleClosePartnerModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
  };

  const handleSavePartner = async (data: any) => {
    if (editingPartner) {
      await updatePartner(data);
    } else {
      await addPartner(data);
    }
    handleClosePartnerModal();
  };
  
  const handleDeletePartner = (id: string) => {
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
      </div>

      <div className="border-b border-accent mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {TABS_VIEWS.map(tab => (
            <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeView === tab.key
                        ? 'border-brand text-brand'
                        : 'border-transparent text-highlight hover:text-light hover:border-gray-500'
                }`}
            >
                {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeView === 'partners' && (
        <PartnersView 
            partners={partners}
            serviceCategories={serviceCategories}
            handleOpenPartnerModal={handleOpenPartnerModal}
            handleDeletePartner={handleDeletePartner}
        />
      )}

      {activeView === 'categories' && (
        <ServiceCategoryList
            serviceCategories={serviceCategories}
            addServiceCategory={addServiceCategory}
            updateServiceCategory={updateServiceCategory}
            deleteServiceCategory={deleteServiceCategory}
        />
      )}
      
      {activeView === 'quotes' && (
          <QuoteList 
              quotes={quotes}
              partners={partners}
              currentUser={currentUser}
              addQuote={addQuote}
              updateQuote={updateQuote}
              deleteQuote={deleteQuote}
          />
      )}

      <Modal isOpen={isModalOpen} onClose={handleClosePartnerModal} title={editingPartner ? t('partners.modalEditTitle') : t('partners.modalAddTitle')}>
        <PartnerForm onSubmit={handleSavePartner} onClose={handleClosePartnerModal} initialData={editingPartner} serviceCategories={serviceCategories} addServiceCategory={addServiceCategory} />
      </Modal>
    </div>
  );
};

export default PartnerList;