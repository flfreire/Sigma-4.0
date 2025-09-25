
import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentStatus, PreventiveMaintenanceSchedule, ChecklistTemplate, ReplacementPart, ProjectFile } from '../types';
import { useTranslation } from '../i18n/config';
import Modal from './Modal';
import { PhotoIcon, PlusIcon, TrashIcon, DocumentIcon, EyeIcon, WrenchScrewdriverIcon, CubeIcon } from './icons';

interface EquipmentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipment: Equipment | null;
    addEquipment: (item: Omit<Equipment, 'id' | 'maintenanceHistory' | 'nextPreventiveMaintenanceDate'>) => Promise<void>;
    updateEquipment: (item: Equipment) => Promise<void>;
    checklistTemplates: ChecklistTemplate[];
    replacementParts: ReplacementPart[];
    addReplacementPart: (item: Omit<ReplacementPart, 'id'>) => Promise<void>;
    updateReplacementPart: (item: ReplacementPart) => Promise<void>;
    deleteReplacementPart: (id: string) => Promise<void>;
}

type ActiveTab = 'general' | 'parts' | 'drawings';

const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({ isOpen, onClose, equipment, addEquipment, updateEquipment, checklistTemplates, replacementParts, addReplacementPart, updateReplacementPart, deleteReplacementPart }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ActiveTab>('general');
    
    const [formData, setFormData] = useState<Omit<Equipment, 'id' | 'maintenanceHistory'>>({
        name: '', type: '', model: '', manufacturer: '', location: '',
        installDate: new Date().toISOString().split('T')[0],
        usageHours: 0, status: EquipmentStatus.Operational, photo: undefined,
        preventiveSchedule: PreventiveMaintenanceSchedule.None, checklistTemplateId: '',
        projectFiles: []
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const isEditMode = equipment !== null;

    useEffect(() => {
        if (equipment) {
            setFormData({ ...equipment });
            setPhotoPreview(equipment.photo || null);
        } else {
             setFormData({
                name: '', type: '', model: '', manufacturer: '', location: '',
                installDate: new Date().toISOString().split('T')[0],
                usageHours: 0, status: EquipmentStatus.Operational, photo: undefined,
                preventiveSchedule: PreventiveMaintenanceSchedule.None, checklistTemplateId: '',
                projectFiles: []
            });
            setPhotoPreview(null);
        }
        setActiveTab('general'); // Reset to general tab whenever modal opens
    }, [equipment, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'usageHours' ? Number(value) : value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert(t('equipment.form.fileSizeError')); return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPhotoPreview(base64String);
                setFormData(prev => ({ ...prev, photo: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemovePhoto = () => {
        setPhotoPreview(null);
        setFormData(prev => ({ ...prev, photo: undefined }));
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    const handleSave = async () => {
        if (isEditMode) {
            await updateEquipment({ ...equipment, ...formData });
        } else {
            await addEquipment(formData);
        }
        onClose();
    };
    
    const renderGeneralTab = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-highlight">{t('equipment.form.photoLabel')}</label>
                <div className="mt-2 flex items-center gap-4">
                    {photoPreview ? (
                        <img src={photoPreview} alt="Equipment preview" className="h-24 w-24 rounded-md object-cover border border-accent" />
                    ) : (
                        <div className="h-24 w-24 bg-primary rounded-md flex items-center justify-center border border-accent">
                            <PhotoIcon className="h-12 w-12 text-accent" />
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="photo-upload" className="cursor-pointer bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight text-sm text-center transition-colors">
                        {t('equipment.form.changePhoto')}
                        </label>
                        <input id="photo-upload" name="photo-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handlePhotoChange} />
                        {photoPreview && (
                        <button type="button" onClick={handleRemovePhoto} className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm transition-colors">
                            {t('equipment.form.removePhoto')}
                        </button>
                        )}
                    </div>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-highlight">{t('equipment.form.name')}</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-highlight">{t('equipment.form.type')}</label>
                    <select name="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                        <option value="" disabled>{t('equipment.form.selectType')}</option>
                        <option value="Machinery">{t('equipment.tabs.machinery')}</option>
                        <option value="Tooling">{t('equipment.tabs.tooling')}</option>
                        <option value="Automation">{t('equipment.form.automation')}</option>
                        <option value="Body in White">{t('equipment.tabs.bodyInWhite')}</option>
                    </select>
                </div>
                <div>
                <label className="block text-sm font-medium text-highlight">{t('equipment.form.location')}</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-highlight">{t('equipment.form.manufacturer')}</label>
                <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
                <div>
                <label className="block text-sm font-medium text-highlight">{t('equipment.form.model')}</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-highlight">{t('equipment.form.installDate')}</label>
                <input type="date" name="installDate" value={formData.installDate} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
                <div>
                <label className="block text-sm font-medium text-highlight">{t('equipment.form.usageHours')}</label>
                <input type="number" name="usageHours" value={formData.usageHours} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-highlight">{t('equipment.form.preventiveSchedule')}</label>
                <select name="preventiveSchedule" value={formData.preventiveSchedule} onChange={handleChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                    {Object.values(PreventiveMaintenanceSchedule).map(schedule => (
                        <option key={schedule} value={schedule}>{t(`enums.preventiveMaintenanceSchedule.${schedule}`)}</option>
                    ))}
                </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('equipment.form.checklistTemplate')}</label>
                    <select name="checklistTemplateId" value={formData.checklistTemplateId} onChange={handleChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                        <option value="">{t('equipment.form.noChecklist')}</option>
                        {checklistTemplates.map(template => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
    
    const renderPartsTab = () => (
        <PartsManager
            equipment={equipment}
            parts={replacementParts.filter(p => p.equipmentId === equipment?.id)}
            addPart={addReplacementPart}
            updatePart={updateReplacementPart}
            deletePart={deleteReplacementPart}
        />
    );
    
    const renderDrawingsTab = () => (
        <DrawingsManager 
            files={formData.projectFiles || []}
            onFileChange={(newFiles) => setFormData(prev => ({...prev, projectFiles: newFiles}))}
        />
    );

    const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
        { id: 'general', label: t('equipment.tabs.general'), icon: <WrenchScrewdriverIcon className="h-5 w-5 mr-2" /> },
        { id: 'parts', label: t('equipment.tabs.parts'), icon: <CubeIcon className="h-5 w-5 mr-2" />, disabled: !isEditMode },
        { id: 'drawings', label: t('equipment.tabs.drawings'), icon: <DocumentIcon className="h-5 w-5 mr-2" />, disabled: !isEditMode },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? t('equipment.modalEditTitle') : t('equipment.modalAddTitle')}>
            <div className="flex flex-col">
                <div className="border-b border-accent">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                disabled={tab.disabled}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    activeTab === tab.id
                                    ? 'border-brand text-brand'
                                    : 'border-transparent text-highlight hover:text-light hover:border-gray-500'
                                }`}
                                >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="py-6 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'general' && renderGeneralTab()}
                    {activeTab === 'parts' && renderPartsTab()}
                    {activeTab === 'drawings' && renderDrawingsTab()}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-accent mt-auto">
                    <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('equipment.form.cancel')}</button>
                    <button type="button" onClick={handleSave} className="bg-brand text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600">{t('equipment.form.save')}</button>
                </div>
            </div>
        </Modal>
    );
};

const PartsManager: React.FC<{
    equipment: Equipment | null;
    parts: ReplacementPart[];
    addPart: (item: Omit<ReplacementPart, 'id'>) => Promise<void>;
    updatePart: (item: ReplacementPart) => Promise<void>;
    deletePart: (id: string) => Promise<void>;
}> = ({ equipment, parts, addPart, updatePart, deletePart }) => {
    const { t } = useTranslation();
    const [editingPart, setEditingPart] = useState<ReplacementPart | 'new' | null>(null);

    if (!equipment) return null;

    const handleSavePart = async (data: any) => {
        if (editingPart === 'new') {
            await addPart(data);
        } else {
            await updatePart(data);
        }
        setEditingPart(null);
    }

    const handleDeletePart = async (partId: string) => {
        if (window.confirm(t('equipment.parts.deleteConfirm'))) {
            await deletePart(partId);
        }
    }

    return (
        <div>
            {editingPart ? (
                <ReplacementPartForm
                    equipmentId={equipment.id}
                    onSubmit={handleSavePart}
                    onClose={() => setEditingPart(null)}
                    initialData={editingPart === 'new' ? null : editingPart}
                />
            ) : (
                <>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setEditingPart('new')} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            {t('equipment.parts.add')}
                        </button>
                    </div>
                    <div className="bg-primary rounded-lg shadow-md border border-accent overflow-x-auto">
                        <table className="min-w-full divide-y divide-accent">
                            <thead className="bg-secondary">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.parts.form.name')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.parts.form.code')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.parts.form.stockQuantity')}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.headers.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-primary divide-y divide-accent">
                                {parts.length > 0 ? parts.map(part => (
                                    <tr key={part.id}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-light">{part.name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-highlight">{part.code}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-highlight">{part.stockQuantity}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => setEditingPart(part)} className="text-brand hover:text-blue-400">{t('equipment.details')}</button>
                                            <button onClick={() => handleDeletePart(part.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-4 w-4 inline"/></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-highlight">
                                           {t('equipment.parts.noParts')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}

const ReplacementPartForm: React.FC<{
    onSubmit: (data: any) => Promise<void>;
    onClose: () => void;
    equipmentId: string;
    initialData?: ReplacementPart | null;
}> = ({ onSubmit, onClose, equipmentId, initialData }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: initialData?.name || '', code: initialData?.code || '',
        stockQuantity: initialData?.stockQuantity || 0, supplier: initialData?.supplier || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'stockQuantity' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({ ...initialData, ...formData, equipmentId });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-1 bg-primary rounded-lg border border-accent">
            <h3 className="text-lg font-bold text-light px-4 pt-4">{initialData ? t('equipment.parts.edit') : t('equipment.parts.add')}</h3>
            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('equipment.parts.form.name')}</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-secondary border-accent rounded-md shadow-sm p-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-highlight">{t('equipment.parts.form.code')}</label>
                        <input type="text" name="code" value={formData.code} onChange={handleChange} required className="mt-1 block w-full bg-secondary border-accent rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-highlight">{t('equipment.parts.form.stockQuantity')}</label>
                        <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} min="0" required className="mt-1 block w-full bg-secondary border-accent rounded-md shadow-sm p-2" />
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t border-accent">
                <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('equipment.form.cancel')}</button>
                <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('equipment.form.save')}</button>
            </div>
        </form>
    );
};

const DrawingsManager: React.FC<{
    files: ProjectFile[],
    onFileChange: (files: ProjectFile[]) => void;
}> = ({ files, onFileChange }) => {
    const { t } = useTranslation();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert(t('equipment.drawings.fileSizeError'));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const newFile: ProjectFile = {
                id: `file-${Date.now()}`,
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' : 'pdf',
                data: reader.result as string
            };
            onFileChange([...files, newFile]);
        };
        reader.readAsDataURL(file);
        e.target.value = ""; // Reset input
    };
    
    const handleFileDelete = (id: string) => {
        if(window.confirm(t('equipment.drawings.deleteConfirm'))) {
            onFileChange(files.filter(f => f.id !== id));
        }
    };
    
    return (
        <div>
            <div className="flex justify-end mb-4">
                 <input type="file" ref={fileInputRef} onChange={handleFileAdd} className="hidden" accept="image/jpeg,image/png,application/pdf" />
                <button onClick={() => fileInputRef.current?.click()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t('equipment.drawings.add')}
                </button>
            </div>
            
            {files.length === 0 ? (
                <div className="text-center py-12 bg-primary rounded-lg border-2 border-dashed border-accent">
                    <DocumentIcon className="mx-auto h-12 w-12 text-accent" />
                    <p className="mt-2 text-highlight">{t('equipment.drawings.noFiles')}</p>
                </div>
            ) : (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map(file => (
                        <div key={file.id} className="group relative aspect-square bg-primary rounded-lg border border-accent flex flex-col items-center justify-center p-2 text-center shadow-md">
                           {file.type === 'image' ? (
                                <img src={file.data} alt={file.name} className="max-h-full max-w-full object-contain rounded-md" />
                           ) : (
                                <DocumentIcon className="h-16 w-16 text-brand" />
                           )}
                           <p className="text-xs text-highlight mt-2 break-all truncate w-full" title={file.name}>{file.name}</p>
                           
                           <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                <a href={file.data} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500" title={t('equipment.drawings.view')}>
                                    <EyeIcon className="h-6 w-6" />
                                </a>
                                <button onClick={() => handleFileDelete(file.id)} className="p-2 rounded-full bg-red-600 text-white hover:bg-red-500" title={t('checklists.delete')}>
                                    <TrashIcon className="h-6 w-6" />
                                </button>
                           </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EquipmentDetailModal;
