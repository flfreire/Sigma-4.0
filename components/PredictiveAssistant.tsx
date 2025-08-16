
import React, { useState, useCallback } from 'react';
import { Equipment, PredictiveAnalysis } from '../types';
import { getPredictiveMaintenanceAnalysis } from '../services/geminiService';
import { SparklesIcon } from './icons';
import { useTranslation } from '../i18n/config';

interface PredictiveAssistantProps {
  equipmentList: Equipment[];
}

const PredictiveAssistant: React.FC<PredictiveAssistantProps> = ({ equipmentList }) => {
  const { t } = useTranslation();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [analysisLanguage, setAnalysisLanguage] = useState<'pt' | 'en'>('pt');
  const [analysis, setAnalysis] = useState<PredictiveAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback(async () => {
    if (!selectedEquipmentId) {
      setError('assistant.errorSelect');
      return;
    }
    
    const equipment = equipmentList.find(e => e.id === selectedEquipmentId);
    if (!equipment) {
      setError('assistant.errorNotFound');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await getPredictiveMaintenanceAnalysis(equipment, analysisLanguage);
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedEquipmentId, equipmentList, analysisLanguage]);

  const selectedEquipment = equipmentList.find(e => e.id === selectedEquipmentId);

  return (
    <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent mt-6">
      <h3 className="text-xl font-bold text-light mb-4 flex items-center">
        <SparklesIcon className="h-6 w-6 text-yellow-400 mr-2" />
        {t('assistant.title')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="md:col-span-2">
            <label htmlFor="equipment-select" className="block text-sm font-medium text-highlight mb-1">
              {t('assistant.selectLabel')}
            </label>
            <select
                id="equipment-select"
                value={selectedEquipmentId}
                onChange={(e) => {
                    setSelectedEquipmentId(e.target.value);
                    setAnalysis(null);
                    setError(null);
                }}
                className="w-full bg-primary border border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand"
            >
                <option value="">{t('assistant.selectPlaceholder')}</option>
                {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name} ({eq.id})</option>
                ))}
            </select>
        </div>
        <div>
            <label htmlFor="language-select" className="block text-sm font-medium text-highlight mb-1">
              {t('assistant.languageLabel')}
            </label>
            <select
                id="language-select"
                value={analysisLanguage}
                onChange={(e) => setAnalysisLanguage(e.target.value as 'pt' | 'en')}
                className="w-full bg-primary border border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand"
            >
                <option value="pt">Português</option>
                <option value="en">English</option>
            </select>
        </div>
        <div className="self-end">
            <button
                onClick={handleAnalysis}
                disabled={!selectedEquipmentId || isLoading}
                className="w-full bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center transition-colors duration-200"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('assistant.analyzingButton')}
                    </>
                ) : t('assistant.analyzeButton')}
            </button>
        </div>
      </div>
      {error && <p className="text-red-400 text-center my-4">{/assistant\.(errorSelect|errorNotFound)/.test(error) ? t(error) : error}</p>}
      
      {analysis && (
        <div className="mt-6 p-4 bg-primary rounded-lg animate-fade-in">
          <h4 className="text-lg font-semibold text-brand mb-2">{t('assistant.analysisFor', { equipmentName: selectedEquipment?.name || '' })}</h4>
          <div className="space-y-4">
            <div>
              <h5 className="font-bold text-highlight">{t('assistant.healthSummary')}</h5>
              <p className="text-light text-sm">{analysis.healthAnalysis}</p>
            </div>
            <div>
              <h5 className="font-bold text-highlight">{t('assistant.recommendation')}</h5>
              <p className="text-light text-sm">{analysis.nextMaintenanceRecommendation}</p>
            </div>
            <div>
              <h5 className="font-bold text-highlight">{t('assistant.risks')}</h5>
              <ul className="list-disc list-inside text-light text-sm space-y-1">
                {analysis.potentialRisks.map((risk, index) => <li key={index}>{risk}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveAssistant;