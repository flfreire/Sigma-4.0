
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Equipment, EquipmentStatus, ReplacementPart, ChecklistTemplate } from '../types';
import { PlusIcon, PhotoIcon, QrCodeIcon } from './icons';
import { useTranslation } from '../i18n/config';
import QRCodeModal from './QRCodeModal';
import EquipmentDetailModal from './EquipmentDetailModal';

interface EquipmentListProps {
  equipment: Equipment[];
  replacementParts: ReplacementPart[];
  checklistTemplates: ChecklistTemplate[];
  addEquipment: (item: Omit<Equipment, 'id' | 'maintenanceHistory' | 'nextPreventiveMaintenanceDate'>) => Promise<void>;
  updateEquipment: (item: Equipment) => Promise<void>;
  addReplacementPart: (item: Omit<ReplacementPart, 'id'>) => Promise<void>;
  updateReplacementPart: (item: ReplacementPart) => Promise<void>;
  deleteReplacementPart: (id: string) => Promise<void>;
  equipmentToFocus?: string | null;
  onFocusDone?: () => void;
}

const statusColorMap: { [key in EquipmentStatus]: string } = {
  [EquipmentStatus.Operational]: 'bg-green-500',
  [EquipmentStatus.InMaintenance]: 'bg-yellow-500',
  [EquipmentStatus.NeedsRepair]: 'bg-red-500',
  [EquipmentStatus.Decommissioned]: 'bg-gray-600',
};

const EquipmentList: React.FC<EquipmentListProps> = ({ equipment, replacementParts, checklistTemplates, addEquipment, updateEquipment, addReplacementPart, updateReplacementPart, deleteReplacementPart, equipmentToFocus, onFocusDone }) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [qrCodeEquipment, setQrCodeEquipment] = useState<Equipment | null>(null);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'All' | 'Machinery' | 'Tooling'>('All');
  
  const handleOpenDetailModal = useCallback((item?: Equipment) => {
    setSelectedEquipment(item || null);
    setIsDetailModalOpen(true);
  }, []);
  
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedEquipment(null);
  };

  useEffect(() => {
    if (equipmentToFocus && equipment.length > 0 && onFocusDone) {
      const itemToFocus = equipment.find(e => e.id === equipmentToFocus);
      if (itemToFocus) {
        handleOpenDetailModal(itemToFocus);
      } else {
        alert(t('scanner.error.notFound'));
      }
      onFocusDone();
    }
  }, [equipmentToFocus, equipment, onFocusDone, handleOpenDetailModal, t]);

  const filteredEquipment = useMemo(() => {
    if (activeTab === 'All') {
      return equipment;
    }
    if (activeTab === 'Machinery') {
      return equipment.filter(item => item.type === 'Machinery' || item.type === 'Automation');
    }
    if (activeTab === 'Tooling') {
      return equipment.filter(item => item.type === 'Tooling');
    }
    return equipment;
  }, [equipment, activeTab]);

  const TABS: { key: 'All' | 'Machinery' | 'Tooling'; labelKey: string }[] = [
    { key: 'All', labelKey: 'equipment.tabs.all' },
    { key: 'Machinery', labelKey: 'equipment.tabs.machinery' },
    { key: 'Tooling', labelKey: 'equipment.tabs.tooling' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-light">{t('equipment.title')}</h2>
        <button onClick={() => handleOpenDetailModal()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('equipment.add')}
        </button>
      </div>

      <div className="border-b border-accent mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-highlight hover:text-light hover:border-gray-500'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-secondary rounded-lg shadow-md border border-accent overflow-x-auto">
        <table className="min-w-full divide-y divide-accent">
          <thead className="bg-primary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.headers.photo')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.headers.name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.headers.type')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.headers.status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.headers.usageHours')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.headers.nextPreventiveDate')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('equipment.headers.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-secondary divide-y divide-accent">
            {filteredEquipment.length > 0 ? (
              filteredEquipment.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} className="h-12 w-12 rounded-md object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center border border-accent">
                        <PhotoIcon className="h-8 w-8 text-accent" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light font-semibold">{item.name}<br/><span className="text-xs text-highlight font-normal">{item.manufacturer} {item.model}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusColorMap[item.status]}`}>
                      {t(`enums.equipmentStatus.${item.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{item.usageHours.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{item.nextPreventiveMaintenanceDate || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button onClick={() => setQrCodeEquipment(item)} className="text-highlight hover:text-light" title={t('equipment.qrCode')}><QrCodeIcon className="h-5 w-5"/></button>
                    <button onClick={() => handleOpenDetailModal(item)} className="text-brand hover:text-blue-400">{t('equipment.details')}</button>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-highlight">
                       {t('equipment.noResults')}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {isDetailModalOpen && (
        <EquipmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          equipment={selectedEquipment}
          addEquipment={addEquipment}
          updateEquipment={updateEquipment}
          checklistTemplates={checklistTemplates}
          replacementParts={replacementParts}
          addReplacementPart={addReplacementPart}
          updateReplacementPart={updateReplacementPart}
          deleteReplacementPart={deleteReplacementPart}
        />
      )}

      {qrCodeEquipment && (
          <QRCodeModal
              isOpen={!!qrCodeEquipment}
              onClose={() => setQrCodeEquipment(null)}
              equipment={qrCodeEquipment}
          />
      )}
    </div>
  );
};

export default EquipmentList;
