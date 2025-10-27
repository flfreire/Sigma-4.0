

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MeasurementInstrument, InstrumentStatus, ChecklistTemplate } from '../types';
import { PlusIcon, ScaleIcon, TrashIcon, ChartPieIcon, ClipboardDocumentCheckIcon } from './icons';
import { useTranslation } from '../i18n/config';
import InstrumentDetailModal from './InstrumentDetailModal';
import MetrologyAnalysis from './MetrologyAnalysis';
import ChecklistTemplates from './ChecklistTemplates';

interface MetrologyListProps {
  instruments: MeasurementInstrument[];
  checklistTemplates: ChecklistTemplate[];
  addInstrument: (item: Omit<MeasurementInstrument, 'id'>) => Promise<void>;
  updateInstrument: (item: MeasurementInstrument) => Promise<void>;
  deleteInstrument: (id: string) => Promise<void>;
  instrumentToFocus?: string | null;
  onFocusDone?: () => void;
  templates: ChecklistTemplate[];
  addTemplate: (template: Omit<ChecklistTemplate, 'id'>) => Promise<void>;
  updateTemplate: (template: ChecklistTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

const statusColorMap: { [key in InstrumentStatus]: string } = {
  [InstrumentStatus.Active]: 'bg-green-500',
  [InstrumentStatus.InCalibration]: 'bg-blue-500',
  [InstrumentStatus.Damaged]: 'bg-red-500',
  [InstrumentStatus.Retired]: 'bg-gray-600',
};

type MetrologyView = 'list' | 'analysis' | 'checklists';

const MetrologyList: React.FC<MetrologyListProps> = ({ instruments, addInstrument, updateInstrument, deleteInstrument, instrumentToFocus, onFocusDone, checklistTemplates, templates, addTemplate, updateTemplate, deleteTemplate }) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<MeasurementInstrument | null>(null);
  const [activeTab, setActiveTab] = useState<MetrologyView>('list');
  const { t } = useTranslation();

  const handleOpenDetailModal = useCallback((item?: MeasurementInstrument) => {
    setSelectedInstrument(item || null);
    setIsDetailModalOpen(true);
  }, []);
  
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedInstrument(null);
  };

  useEffect(() => {
    if (instrumentToFocus && instruments.length > 0 && onFocusDone) {
      setActiveTab('list');
      const itemToFocus = instruments.find(e => e.id === instrumentToFocus);
      if (itemToFocus) {
        handleOpenDetailModal(itemToFocus);
      } else {
        alert(t('scanner.error.notFound')); // Reusing scanner error for generic not found
      }
      onFocusDone();
    }
  }, [instrumentToFocus, instruments, onFocusDone, handleOpenDetailModal, t]);

  const handleDelete = (instrument: MeasurementInstrument) => {
    if (window.confirm(t('metrology.deleteConfirm', { name: instrument.name, id: instrument.id }))) {
        deleteInstrument(instrument.id);
    }
  };

  const getCalibrationStatusColor = (dateStr?: string): string => {
    if (!dateStr) return 'text-highlight';
    const dueDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-400 font-bold';
    if (diffDays <= 30) return 'text-yellow-400 font-semibold';
    return 'text-light';
  };

  const TABS = [
    { key: 'list', label: t('metrology.tabs.list'), icon: <ScaleIcon className="h-5 w-5 mr-2" /> },
    { key: 'analysis', label: t('metrology.tabs.analysis'), icon: <ChartPieIcon className="h-5 w-5 mr-2" /> },
    { key: 'checklists', label: t('metrology.tabs.checklists'), icon: <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" /> },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-light flex items-center">
            <ScaleIcon className="h-8 w-8 mr-3 text-brand" />
            {t('metrology.title')}
        </h2>
        {activeTab === 'list' && (
            <button onClick={() => handleOpenDetailModal()} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('metrology.add')}
            </button>
        )}
      </div>

       <div className="border-b border-accent mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as MetrologyView)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-highlight hover:text-light hover:border-gray-500'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'list' && (
        <div className="bg-secondary rounded-lg shadow-md border border-accent overflow-x-auto">
            <table className="min-w-full divide-y divide-accent">
            <thead className="bg-primary">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('metrology.headers.id')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('metrology.headers.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('metrology.headers.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('metrology.headers.location')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('metrology.headers.lastCalibration')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('metrology.headers.nextCalibration')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-highlight uppercase tracking-wider">{t('metrology.headers.actions')}</th>
                </tr>
            </thead>
            <tbody className="bg-secondary divide-y divide-accent">
                {instruments.length > 0 ? (
                instruments.map(item => (
                    <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light font-mono">{item.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light font-semibold">{item.name}<br/><span className="text-xs text-highlight font-normal">{item.manufacturer} {item.model}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusColorMap[item.status]}`}>
                        {t(`enums.instrumentStatus.${item.status}`)}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{item.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-highlight">{item.lastCalibrationDate || 'N/A'}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getCalibrationStatusColor(item.nextCalibrationDate)}`}>{item.nextCalibrationDate || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                        <button onClick={() => handleOpenDetailModal(item)} className="text-brand hover:text-blue-400">{t('metrology.details')}</button>
                        <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-400"><TrashIcon className="h-4 w-4 inline"/></button>
                    </td>
                    </tr>
                ))
                ) : (
                    <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-highlight">
                        {t('metrology.noInstruments')}
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      )}
      
      {activeTab === 'analysis' && (
          <MetrologyAnalysis instruments={instruments} />
      )}

      {activeTab === 'checklists' && (
          <ChecklistTemplates
            templates={templates}
            addTemplate={addTemplate}
            updateTemplate={updateTemplate}
            deleteTemplate={deleteTemplate}
            type="metrology"
          />
      )}
      
      {isDetailModalOpen && (
        <InstrumentDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          instrument={selectedInstrument}
          addInstrument={addInstrument}
          updateInstrument={updateInstrument}
          checklistTemplates={checklistTemplates}
        />
      )}
    </div>
  );
};

export default MetrologyList;