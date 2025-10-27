
import React, { useState, useEffect, useMemo } from 'react';
import { ServiceOrder, Equipment, MaintenanceType, ServiceOrderStatus, ChecklistTemplate, ChecklistExecution, User, Team, FailureMode } from '../types';
import Modal from './Modal';
import { PlusIcon, PhotoIcon, XMarkIcon } from './icons';
import { useTranslation } from '../i18n/config';
import ChecklistExecutionModal from './ChecklistExecutionModal';
import { useAuth } from '../contexts/AuthContext';
import FailureModeList from './FailureModeList';

interface ServiceOrderListProps {
  serviceOrders: ServiceOrder[];
  equipment: Equipment[];
  checklistTemplates: ChecklistTemplate[];
  checklistExecutions: ChecklistExecution[];
  users: User[];
  teams: Team[];
  failureModes: FailureMode[];
  addServiceOrder: (order: Omit<ServiceOrder, 'id'>) => Promise<void>;
  updateServiceOrder: (order: ServiceOrder) => Promise<void>;
  addChecklistExecution: (execution: Omit<ChecklistExecution, 'id'>, serviceOrder: ServiceOrder) => Promise<void>;
  getChecklistExecutionById: (id: string) => ChecklistExecution | undefined;
  addFailureMode: (mode: Omit<FailureMode, 'id'>) => Promise<void>;
  updateFailureMode: (mode: FailureMode) => Promise<void>;
  deleteFailureMode: (id: string) => Promise<void>;
}

const statusColorMap: { [key in ServiceOrderStatus]: string } = {
  [ServiceOrderStatus.Open]: 'bg-blue-500',
  [ServiceOrderStatus.InProgress]: 'bg-yellow-500',
  [ServiceOrderStatus.Completed]: 'bg-green-500',
  [ServiceOrderStatus.Cancelled]: 'bg-gray-600',
};

const ServiceOrderForm: React.FC<{
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
  initialData?: ServiceOrder | null;
  equipment: Equipment[];
  teams: Team[];
  failureModes: FailureMode[];
}> = ({ onSubmit, onClose, initialData, equipment, teams, failureModes }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        equipmentId: initialData?.equipmentId || '',
        type: initialData?.type || MaintenanceType.Preventive,
        status: initialData?.status || ServiceOrderStatus.Open,
        description: initialData?.description || '',
        assignedToTeamId: initialData?.assignedToTeamId || '',
        scheduledDate: initialData?.scheduledDate || new Date().toISOString().split('T')[0],
        rehabilitationCost: initialData?.rehabilitationCost || 0,
        photos: initialData?.photos || [],
        failureModeId: initialData?.failureModeId || '',
    });

    const isNewOrder = !initialData;

    useEffect(() => {
        if (isNewOrder && formData.type === MaintenanceType.Preventive) {
            const selectedEquipment = equipment.find(e => e.id === formData.equipmentId);
            if(selectedEquipment?.nextPreventiveMaintenanceDate) {
                setFormData(prev => ({...prev, scheduledDate: selectedEquipment.nextPreventiveMaintenanceDate || new Date().toISOString().split('T')[0]}))
            }
        }
    }, [formData.equipmentId, formData.type, isNewOrder, equipment]);

    const selectedEquipment = useMemo(() => equipment.find(e => e.id === formData.equipmentId), [equipment, formData.equipmentId]);

    const relevantFailureModes = useMemo(() => {
        if (!selectedEquipment) return [];
        const validTypes = selectedEquipment.type === 'Automation' 
            ? ['Machinery', 'Automation'] 
            : [selectedEquipment.type];
        return failureModes.filter(fm => validTypes.includes(fm.equipmentType));
    }, [selectedEquipment, failureModes]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumber = e.target.type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // FIX: Replaced for...of loop with a traditional for loop to iterate over the FileList.
            // This resolves a type inference issue where 'file' was being typed as 'unknown', causing errors.
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files.item(i);
                if (!file) {
                    continue;
                }
                if (file.size > 2 * 1024 * 1024) { // 2MB limit
                    alert(`File ${file.name} is too large. Please select an image under 2MB.`);
                    continue;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setFormData(prev => ({
                        ...prev,
                        photos: [...(prev.photos || []), base64String]
                    }));
                };
                reader.readAsDataURL(file);
            }
            e.target.value = ""; // Allow re-selecting the same file
        }
    };
    
    const handleRemovePhoto = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, index) => index !== indexToRemove)
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({ ...initialData, ...formData });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div>
                <label className="block text-sm font-medium text-highlight">{t('serviceOrders.form.equipment')}</label>
                <select name="equipmentId" value={formData.equipmentId} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                    <option value="">{t('serviceOrders.form.selectEquipment')}</option>
                    {equipment.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('serviceOrders.form.maintenanceType')}</label>
                    <select name="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                        {Object.values(MaintenanceType).map(tEnum => <option key={tEnum} value={tEnum}>{t(`enums.maintenanceType.${tEnum}`)}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('serviceOrders.form.status')}</label>
                    <select name="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                        {Object.values(ServiceOrderStatus).map(sEnum => <option key={sEnum} value={sEnum}>{t(`enums.serviceOrderStatus.${sEnum}`)}</option>)}
                    </select>
                </div>
            </div>
             {formData.type === MaintenanceType.Corrective && (
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('serviceOrders.form.failureMode')}</label>
                    <select
                        name="failureModeId"
                        value={formData.failureModeId}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2 disabled:opacity-50"
                        disabled={!formData.equipmentId}
                    >
                        <option value="">{t('serviceOrders.form.selectFailureMode')}</option>
                        {relevantFailureModes.map(fm => <option key={fm.id} value={fm.id}>{fm.name}</option>)}
                    </select>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-highlight">{t('serviceOrders.form.description')}</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                     <label className="block text-sm font-medium text-highlight">{t('serviceOrders.form.assignedTeam')}</label>
                    <select name="assignedToTeamId" value={formData.assignedToTeamId} onChange={handleChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                        <option value="">{t('serviceOrders.form.selectTeam')}</option>
                        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('serviceOrders.form.scheduledDate')}</label>
                    <input
                        type="date"
                        name="scheduledDate"
                        value={formData.scheduledDate}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2"
                    />
                </div>
            </div>

            {(
                formData.type === MaintenanceType.Rehabilitation ||
                formData.type === MaintenanceType.Corrective ||
                formData.type === MaintenanceType.Preventive
            ) && (
                <div className="space-y-4 pt-4 border-t border-accent">
                    {formData.type === MaintenanceType.Rehabilitation && (
                        <div>
                            <label className="block text-sm font-medium text-highlight">{t('serviceOrders.form.rehabilitationCost')}</label>
                            <input type="number" name="rehabilitationCost" value={formData.rehabilitationCost} onChange={handleChange} min="0" step="0.01" className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2"/>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-highlight">{t('serviceOrders.form.photos')}</label>
                        <label htmlFor="photo-upload" className="mt-1 cursor-pointer bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight text-sm text-center transition-colors inline-block">
                          {t('serviceOrders.form.addPhotos')}
                        </label>
                        <input id="photo-upload" name="photo-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handlePhotoChange} multiple/>
                        {formData.photos && formData.photos.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-highlight mb-2">{t('serviceOrders.form.photoPreviews')}</p>
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {formData.photos.map((photo, index) => (
                                        <div key={index} className="relative">
                                            <img src={photo} alt={`Preview ${index}`} className="h-24 w-24 rounded-md object-cover border-2 border-accent"/>
                                            <button type="button" onClick={() => handleRemovePhoto(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 leading-none">
                                                <XMarkIcon className="h-4 w-4"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('serviceOrders.form.cancel')}</button>
                <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('serviceOrders.form.save')}</button>
            </div>
        </form>
    )
}

const ServiceOrderList: React.FC<ServiceOrderListProps> = ({ serviceOrders, equipment, addServiceOrder, updateServiceOrder, checklistTemplates, addChecklistExecution, getChecklistExecutionById, users, teams, failureModes, addFailureMode, updateFailureMode, deleteFailureMode }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [detailsModalOrder, setDetailsModalOrder] = useState<ServiceOrder | null>(null);
    const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
    const [checklistTarget, setChecklistTarget] = useState<{order: ServiceOrder, readOnly: boolean} | null>(null);
    const { t, language } = useTranslation();
    const { user } = useAuth();

    const [activeView, setActiveView] = useState<'orders' | 'failureModes'>('orders');
    const [activeTab, setActiveTab] = useState<MaintenanceType | 'All'>('All');

    const [filters, setFilters] = useState({
        status: '',
        searchTerm: '',
        startDate: '',
        endDate: '',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ status: '', searchTerm: '', startDate: '', endDate: '' });
    };
    
    const getEquipmentName = (id: string) => equipment.find(e => e.id === id)?.name || 'N/A';
    const getTeamName = (teamId?: string) => teams.find(t => t.id === teamId)?.name || 'N/A';

    const filteredServiceOrders = useMemo(() => {
        return serviceOrders.filter(order => {
            const equipmentName = getEquipmentName(order.equipmentId).toLowerCase();
            const description = order.description.toLowerCase();
            const teamName = getTeamName(order.assignedToTeamId).toLowerCase();
            const searchTerm = filters.searchTerm.toLowerCase();

            const statusMatch = !filters.status || order.status === filters.status;
            const typeMatch = activeTab === 'All' || order.type === activeTab;
            const termMatch = !searchTerm || equipmentName.includes(searchTerm) || description.includes(searchTerm) || teamName.includes(searchTerm);
            
            const orderDate = new Date(order.scheduledDate + 'T00:00:00');
            const startDate = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null;
            const endDate = filters.endDate ? new Date(filters.endDate + 'T00:00:00') : null;

            const startDateMatch = !startDate || orderDate >= startDate;
            const endDateMatch = !endDate || orderDate <= endDate;
            
            return statusMatch && typeMatch && termMatch && startDateMatch && endDateMatch;
        });
    }, [serviceOrders, filters, equipment, teams, activeTab]);

    const handleOpenModal = (order?: ServiceOrder) => {
        setEditingOrder(order || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOrder(null);
    };

    const handleOpenChecklistModal = (order: ServiceOrder, readOnly: boolean) => {
        setChecklistTarget({ order, readOnly });
        setIsChecklistModalOpen(true);
    };

    const handleCloseChecklistModal = () => {
        setIsChecklistModalOpen(false);
        setChecklistTarget(null);
    };

    const handleSave = async (data: any) => {
        if (editingOrder) {
            await updateServiceOrder(data);
        } else {
            await addServiceOrder(data);
        }
    };
    
    const TABS_VIEWS = [
        { key: 'orders', label: t('serviceOrders.tabs.orders') },
        { key: 'failureModes', label: t('serviceOrders.tabs.failureModes') },
    ];
    
    const FILTER_TABS: (MaintenanceType | 'All')[] = ['All', MaintenanceType.Preventive, MaintenanceType.Corrective, MaintenanceType.Predictive, MaintenanceType.Rehabilitation];
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-light">{t('serviceOrders.title')}</h2>
                {activeView === 'orders' && (
                    <button onClick={() => handleOpenModal()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        {t('serviceOrders.create')}
                    </button>
                )}
            </div>

            <div className="border-b border-accent mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {TABS_VIEWS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveView(tab.key as 'orders' | 'failureModes')}
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
            
            {activeView === 'orders' && (
                <>
                    <div className="border-b border-accent mb-6">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                            {FILTER_TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === tab
                                            ? 'border-brand text-brand'
                                            : 'border-transparent text-highlight hover:text-light hover:border-gray-500'
                                    }`}
                                >
                                    {tab === 'All' ? t('serviceOrders.filters.all') : t(`enums.maintenanceType.${tab}`)}
                                </button>
                            ))}
                        </nav>
                    </div>
                    
                    <div className="bg-secondary p-4 rounded-lg shadow-md border border-accent mb-6">
                        <h3 className="text-lg font-bold text-light mb-4">{t('serviceOrders.filters.title')}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-highlight" htmlFor="searchTerm">{t('serviceOrders.filters.searchTermPlaceholder')}</label>
                                    <input
                                        type="text"
                                        id="searchTerm"
                                        name="searchTerm"
                                        value={filters.searchTerm}
                                        onChange={handleFilterChange}
                                        placeholder={t('serviceOrders.filters.searchTermPlaceholder')}
                                        className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-highlight" htmlFor="status-filter">{t('serviceOrders.filters.status')}</label>
                                    <select id="status-filter" name="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                                        <option value="">{t('serviceOrders.filters.all')}</option>
                                        {Object.values(ServiceOrderStatus).map(s => <option key={s} value={s}>{t(`enums.serviceOrderStatus.${s}`)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-highlight" htmlFor="startDate">{t('serviceOrders.filters.startDate')}</label>
                                    <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-highlight" htmlFor="endDate">{t('serviceOrders.filters.endDate')}</label>
                                    <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2"/>
                                </div>
                                <div>
                                    <button onClick={clearFilters} className="w-full bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight transition-colors">
                                        {t('serviceOrders.filters.clear')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-secondary rounded-lg shadow-md border border-accent overflow-x-auto">
                        <table className="min-w-full divide-y divide-accent">
                            <thead className="bg-primary">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('serviceOrders.headers.orderId')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('serviceOrders.headers.equipment')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('serviceOrders.headers.type')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('serviceOrders.headers.status')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('serviceOrders.headers.openedDate')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('serviceOrders.headers.closedDate')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('serviceOrders.headers.duration')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('serviceOrders.headers.cost')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('serviceOrders.headers.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-secondary divide-y divide-accent">
                                {filteredServiceOrders.length > 0 ? (
                                    filteredServiceOrders.map(order => {
                                        const equipmentForOrder = equipment.find(e => e.id === order.equipmentId);
                                        const canHaveChecklist = order.type === MaintenanceType.Preventive && equipmentForOrder?.checklistTemplateId;
                                        const isChecklistDone = !!order.checklistExecutionId;

                                        return (
                                        <tr key={order.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-light">{order.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light">{getEquipmentName(order.equipmentId)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{t(`enums.maintenanceType.${order.type}`)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusColorMap[order.status]}`}>
                                                    {t(`enums.serviceOrderStatus.${order.status}`)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{order.openedDate ? new Date(order.openedDate).toLocaleString(language, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{order.closedDate ? new Date(order.closedDate).toLocaleString(language, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{order.maintenanceDuration ? order.maintenanceDuration.toFixed(1) : '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">
                                                {order.rehabilitationCost ? order.rehabilitationCost.toLocaleString(language, { style: 'currency', currency: language === 'pt' ? 'BRL' : 'USD' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                {[MaintenanceType.Corrective, MaintenanceType.Preventive, MaintenanceType.Rehabilitation].includes(order.type) && order.photos && order.photos.length > 0 && (
                                                    <button onClick={() => setDetailsModalOrder(order)} className="text-highlight hover:text-light" title={t('serviceOrders.form.photos')}>
                                                        <PhotoIcon className="h-5 w-5"/>
                                                    </button>
                                                )}
                                                <button onClick={() => handleOpenModal(order)} className="text-brand hover:text-blue-400">{t('serviceOrders.edit')}</button>
                                                {canHaveChecklist && !isChecklistDone && (
                                                    <button onClick={() => handleOpenChecklistModal(order, false)} className="text-yellow-400 hover:text-yellow-300">{t('serviceOrders.fillChecklist')}</button>
                                                )}
                                                {isChecklistDone && (
                                                    <button onClick={() => handleOpenChecklistModal(order, true)} className="text-green-400 hover:text-green-300">{t('serviceOrders.viewChecklist')}</button>
                                                )}
                                            </td>
                                        </tr>
                                    )})
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-highlight">
                                            {t('serviceOrders.filters.noResults')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeView === 'failureModes' && (
                <FailureModeList 
                    failureModes={failureModes}
                    addFailureMode={addFailureMode}
                    updateFailureMode={updateFailureMode}
                    deleteFailureMode={deleteFailureMode}
                />
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingOrder ? t('serviceOrders.modalEditTitle') : t('serviceOrders.modalAddTitle')}>
                <ServiceOrderForm onSubmit={handleSave} onClose={handleCloseModal} initialData={editingOrder} equipment={equipment} teams={teams} failureModes={failureModes} />
            </Modal>
             {detailsModalOrder && (
                <Modal isOpen={!!detailsModalOrder} onClose={() => setDetailsModalOrder(null)} title={t('serviceOrders.photosModalTitle')}>
                    <div className="max-h-[70vh] overflow-y-auto p-1">
                        <h3 className="text-lg font-bold text-light mb-2">{getEquipmentName(detailsModalOrder.equipmentId)}</h3>
                        {detailsModalOrder.type === MaintenanceType.Rehabilitation && detailsModalOrder.rehabilitationCost ? (
                            <p className="text-highlight mb-4"><span className="font-semibold">{t('serviceOrders.headers.cost')}:</span> {detailsModalOrder.rehabilitationCost.toLocaleString(language, { style: 'currency', currency: language === 'pt' ? 'BRL' : 'USD' })}</p>
                        ) : null}
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {detailsModalOrder.photos?.map((photo, index) => (
                                <a key={index} href={photo} target="_blank" rel="noopener noreferrer">
                                    <img src={photo} alt={`Maintenance photo ${index + 1}`} className="rounded-md object-cover w-full h-40 border-2 border-accent hover:border-brand transition-colors"/>
                                </a>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}
            {isChecklistModalOpen && checklistTarget && user && (
                <ChecklistExecutionModal
                    isOpen={isChecklistModalOpen}
                    onClose={handleCloseChecklistModal}
                    serviceOrder={checklistTarget.order}
                    equipment={equipment.find(e => e.id === checklistTarget.order.equipmentId)!}
                    checklistTemplates={checklistTemplates}
                    currentUser={user}
                    readOnly={checklistTarget.readOnly}
                    onSubmit={addChecklistExecution}
                    getExecution={getChecklistExecutionById}
                    users={users}
                />
            )}
        </div>
    );
};

export default ServiceOrderList;