
import React, { useState, useEffect } from 'react';
import { MeasurementInstrument, InstrumentStatus, CalibrationLog } from '../types';
import { useTranslation } from '../i18n/config';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ScaleIcon, CalendarDaysIcon, XMarkIcon } from './icons';

interface InstrumentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    instrument: MeasurementInstrument | null;
    addInstrument: (item: Omit<MeasurementInstrument, 'id'>) => Promise<void>;
    updateInstrument: (item: MeasurementInstrument) => Promise<void>;
}

type ActiveTab = 'general' | 'calibration';

const InstrumentDetailModal: React.FC<InstrumentDetailModalProps> = ({ isOpen, onClose, instrument, addInstrument, updateInstrument }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ActiveTab>('general');
    
    const [formData, setFormData] = useState<Omit<MeasurementInstrument, 'calibrationHistory'> & { calibrationHistory: CalibrationLog[] }>({
        id: '', name: '', model: '', manufacturer: '', location: '', serialNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        status: InstrumentStatus.Active,
        calibrationIntervalMonths: 12, lastCalibrationDate: '',
        calibrationHistory: []
    });

    const isEditMode = instrument !== null;

    useEffect(() => {
        if (instrument) {
            setFormData({ ...instrument });
        } else {
             setFormData({
                id: '', name: '', model: '', manufacturer: '', location: '', serialNumber: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                status: InstrumentStatus.Active,
                calibrationIntervalMonths: 12, lastCalibrationDate: '',
                calibrationHistory: []
            });
        }
        setActiveTab('general');
    }, [instrument, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'calibrationIntervalMonths' ? Number(value) : value }));
    };

    const handleSave = async () => {
        if (isEditMode) {
            await updateInstrument({ ...instrument, ...formData });
        } else {
            const { id, ...dataToAdd } = formData;
            await addInstrument({ ...dataToAdd, id: formData.id || `INST-${Date.now()}` });
        }
        onClose();
    };

    const handleAddCalibration = (newLog: Omit<CalibrationLog, 'id'>) => {
        const fullLog = { ...newLog, id: `cal-${Date.now()}` };
        const newHistory = [...formData.calibrationHistory, fullLog];
        
        const latestApprovedDate = newHistory
            .filter(log => log.result === 'Approved')
            .map(log => new Date(log.date).getTime())
            .reduce((max, current) => Math.max(max, current), 0);
            
        const newLastCalDate = latestApprovedDate > 0 ? new Date(latestApprovedDate).toISOString().split('T')[0] : formData.lastCalibrationDate;

        setFormData(prev => ({
            ...prev,
            calibrationHistory: newHistory,
            lastCalibrationDate: newLastCalDate,
        }));
    };
    
    const handleDeleteCalibration = (id: string) => {
        if (window.confirm(t('metrology.calibration.deleteConfirm'))) {
            setFormData(prev => ({
                ...prev,
                calibrationHistory: prev.calibrationHistory.filter(log => log.id !== id)
            }));
        }
    }
    
    const renderGeneralTab = () => (
        <div className="space-y-4">
            {!isEditMode && (
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.form.id')}</label>
                    <input type="text" name="id" value={formData.id} onChange={handleChange} placeholder={t('metrology.form.idPlaceholder')} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-highlight">{t('metrology.form.name')}</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.form.manufacturer')}</label>
                    <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.form.model')}</label>
                    <input type="text" name="model" value={formData.model} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.form.serialNumber')}</label>
                    <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.form.purchaseDate')}</label>
                    <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.form.status')}</label>
                    <select name="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                        {Object.values(InstrumentStatus).map(s => <option key={s} value={s}>{t(`enums.instrumentStatus.${s}`)}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.form.location')}</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.form.calibrationInterval')}</label>
                    <input type="number" name="calibrationIntervalMonths" value={formData.calibrationIntervalMonths} onChange={handleChange} min="1" required className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.form.lastCalibrationDate')}</label>
                    <input type="date" name="lastCalibrationDate" value={formData.lastCalibrationDate} onChange={handleChange} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2" />
                </div>
            </div>
        </div>
    );
    
    const renderCalibrationTab = () => (
        <CalibrationManager
            history={formData.calibrationHistory}
            onAdd={handleAddCalibration}
            onDelete={handleDeleteCalibration}
        />
    );

    const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
        { id: 'general', label: t('metrology.tabs.general'), icon: <ScaleIcon className="h-5 w-5 mr-2" /> },
        { id: 'calibration', label: t('metrology.tabs.calibration'), icon: <CalendarDaysIcon className="h-5 w-5 mr-2" />, disabled: !isEditMode },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? t('metrology.modalEditTitle') : t('metrology.modalAddTitle')}>
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
                    {activeTab === 'calibration' && renderCalibrationTab()}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-accent mt-auto">
                    <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('metrology.form.cancel')}</button>
                    <button type="button" onClick={handleSave} className="bg-brand text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600">{t('metrology.form.save')}</button>
                </div>
            </div>
        </Modal>
    );
};

const CalibrationManager: React.FC<{
    history: CalibrationLog[];
    onAdd: (log: Omit<CalibrationLog, 'id'>) => void;
    onDelete: (id: string) => void;
}> = ({ history, onAdd, onDelete }) => {
    const { t } = useTranslation();
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div>
            {isAdding ? (
                <CalibrationForm
                    onSubmit={(data) => { onAdd(data); setIsAdding(false); }}
                    onClose={() => setIsAdding(false)}
                />
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-light">{t('metrology.calibration.title')}</h3>
                        <button onClick={() => setIsAdding(true)} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            {t('metrology.calibration.add')}
                        </button>
                    </div>
                    {history.length > 0 ? (
                        <ul className="space-y-3">
                            {history.map(log => (
                                <li key={log.id} className="bg-primary p-3 rounded-lg border border-accent flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-light">{new Date(log.date + 'T00:00:00').toLocaleDateString()}</p>
                                        <p className="text-sm text-highlight">{t('metrology.calibration.headers.technician')}: {log.technician}</p>
                                        <p className="text-sm text-highlight">{t('metrology.calibration.headers.certificate')}: {log.certificateNumber}</p>
                                        {log.notes && <p className="text-xs text-gray-400 mt-1 italic">"{log.notes}"</p>}
                                    </div>
                                    <div className="flex items-center gap-4">
                                         <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${log.result === 'Approved' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                            {t(`metrology.calibration.form.${log.result.toLowerCase()}`)}
                                        </span>
                                        <button onClick={() => onDelete(log.id)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-4 w-4"/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-highlight py-8">{t('metrology.calibration.noRecords')}</p>
                    )}
                </>
            )}
        </div>
    );
};

const CalibrationForm: React.FC<{
    onSubmit: (data: Omit<CalibrationLog, 'id'>) => void;
    onClose: () => void;
}> = ({ onSubmit, onClose }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        technician: '',
        certificateNumber: '',
        result: 'Approved' as 'Approved' | 'Rejected',
        notes: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-primary rounded-lg border border-accent space-y-4">
            <h4 className="text-lg font-bold text-light">{t('metrology.calibration.form.title')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.calibration.form.date')}</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full bg-secondary border-accent rounded-md p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-highlight">{t('metrology.calibration.form.result')}</label>
                    <select name="result" value={formData.result} onChange={handleChange} required className="mt-1 block w-full bg-secondary border-accent rounded-md p-2">
                        <option value="Approved">{t('metrology.calibration.form.approved')}</option>
                        <option value="Rejected">{t('metrology.calibration.form.rejected')}</option>
                    </select>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-highlight">{t('metrology.calibration.form.technician')}</label>
                <input type="text" name="technician" value={formData.technician} onChange={handleChange} required className="mt-1 block w-full bg-secondary border-accent rounded-md p-2" />
            </div>
             <div>
                <label className="block text-sm font-medium text-highlight">{t('metrology.calibration.form.certificate')}</label>
                <input type="text" name="certificateNumber" value={formData.certificateNumber} onChange={handleChange} required className="mt-1 block w-full bg-secondary border-accent rounded-md p-2" />
            </div>
            <div>
                 <label className="block text-sm font-medium text-highlight">{t('metrology.calibration.form.notes')}</label>
                 <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder={t('metrology.calibration.form.notesPlaceholder')} className="mt-1 block w-full bg-secondary border-accent rounded-md p-2" />
            </div>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="bg-accent text-light py-2 px-4 rounded-md hover:bg-highlight">{t('metrology.form.cancel')}</button>
                <button type="submit" className="bg-brand text-white py-2 px-4 rounded-md hover:bg-blue-600">{t('metrology.calibration.add')}</button>
            </div>
        </form>
    );
};

export default InstrumentDetailModal;
