
import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Equipment, ServiceOrder, FailureMode, MaintenanceType, ServiceOrderStatus } from '../types';
import { useTranslation } from '../i18n/config';
import { ChartPieIcon } from './icons';

interface AnalysisProps {
  equipment: Equipment[];
  serviceOrders: ServiceOrder[];
  failureModes: FailureMode[];
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent">
    <h3 className="text-xl font-bold text-light mb-4">{title}</h3>
    <div className="w-full h-80">
      {children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-primary p-3 border border-accent rounded-md shadow-lg">
        <p className="label text-light font-bold mb-2">{label}</p>
        {payload.map((pld: any) => (
           <p key={pld.dataKey} style={{ color: pld.fill }}>
              {`${pld.name}: ${pld.dataKey.includes('mtbf') ? `${pld.value.toFixed(0)} h` : pld.value}`}
           </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analysis: React.FC<AnalysisProps> = ({ equipment, serviceOrders, failureModes }) => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState<string>('All');
  
  const equipmentTypes = useMemo(() => [...new Set(equipment.map(e => e.type))], [equipment]);

  const filteredCorrectiveOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      if (order.type !== MaintenanceType.Corrective || order.status !== ServiceOrderStatus.Completed || !order.closedDate) {
        return false;
      }
      const orderDate = new Date(order.closedDate);
      const startDate = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
      const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;

      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;
      
      const eq = equipment.find(e => e.id === order.equipmentId);
      if (equipmentTypeFilter !== 'All' && eq?.type !== equipmentTypeFilter) return false;

      return true;
    });
  }, [serviceOrders, dateRange, equipmentTypeFilter, equipment]);
  
  const mtbfData = useMemo(() => {
    const failuresByEqType: Record<string, number> = {};
    filteredCorrectiveOrders.forEach(order => {
        const eq = equipment.find(e => e.id === order.equipmentId);
        if (eq) {
            failuresByEqType[eq.type] = (failuresByEqType[eq.type] || 0) + 1;
        }
    });

    return equipmentTypes.map(type => {
        const relevantEquipment = equipment.filter(e => e.type === type);
        const numberOfFailures = failuresByEqType[type] || 0;
        
        if (numberOfFailures === 0 || relevantEquipment.length === 0) {
            return { name: t(`enums.equipmentType.${type}`), mtbf: 0 };
        }
        
        const totalUptimeHours = relevantEquipment.reduce((acc, eq) => {
            const installDate = new Date(eq.installDate).getTime();
            const now = new Date().getTime();
            const uptimeMs = Number(now) - Number(installDate);
            return acc + (uptimeMs / (1000 * 60 * 60));
        }, 0);

        const mtbf = totalUptimeHours / numberOfFailures;
        return { name: t(`enums.equipmentType.${type}`), mtbf };
    }).filter(d => d.mtbf > 0);
  }, [filteredCorrectiveOrders, equipment, equipmentTypes, t]);

  const frequentFailuresData = useMemo(() => {
    const failureCounts = filteredCorrectiveOrders.reduce((acc, order) => {
      if (order.failureModeId) {
        acc[order.failureModeId] = (acc[order.failureModeId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(failureCounts)
      .map(([id, count]) => ({
        id,
        name: failureModes.find(fm => fm.id === id)?.name || 'Unknown',
        count,
      }))
      // FIX: Explicitly cast operands to Number to resolve potential TS2362 error on subtraction.
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 5);
  }, [filteredCorrectiveOrders, failureModes]);

  const problematicEquipmentData = useMemo(() => {
    const equipmentCounts = filteredCorrectiveOrders.reduce((acc, order) => {
      acc[order.equipmentId] = (acc[order.equipmentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(equipmentCounts)
      .map(([id, count]) => ({
        id,
        name: equipment.find(e => e.id === id)?.name || 'Unknown',
        count,
      }))
      // FIX: Explicitly cast operands to Number to resolve potential TS2362 error on subtraction.
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 5);
  }, [filteredCorrectiveOrders, equipment]);


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-light flex items-center">
        <ChartPieIcon className="h-8 w-8 mr-3 text-brand" />
        {t('analysis.title')}
      </h2>

      <div className="bg-secondary p-4 rounded-lg shadow-md border border-accent">
        <h3 className="text-lg font-bold text-light mb-4">{t('analysis.filters.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-medium text-highlight" htmlFor="startDate">{t('analysis.filters.dateRange')}</label>
                <div className="flex items-center gap-2 mt-1">
                    <input type="date" name="start" id="startDate" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="block w-full bg-primary border-accent rounded-md shadow-sm p-2"/>
                    <span>-</span>
                    <input type="date" name="end" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="block w-full bg-primary border-accent rounded-md shadow-sm p-2"/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-highlight" htmlFor="equipmentType">{t('analysis.filters.equipmentType')}</label>
                <select id="equipmentType" name="equipmentType" value={equipmentTypeFilter} onChange={e => setEquipmentTypeFilter(e.target.value)} className="mt-1 block w-full bg-primary border-accent rounded-md shadow-sm p-2">
                    <option value="All">{t('analysis.filters.allTypes')}</option>
                    {equipmentTypes.map(type => <option key={type} value={type}>{t(`enums.equipmentType.${type}`)}</option>)}
                </select>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('analysis.charts.frequentFailuresTitle')}>
          {frequentFailuresData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={frequentFailuresData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 141, 169, 0.2)" />
                <XAxis type="number" stroke="#E0E1DD" allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#E0E1DD" width={120} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(119, 141, 169, 0.2)' }} />
                <Bar dataKey="count" fill="#3B82F6" name={t('analysis.charts.count')} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-highlight pt-20">{t('analysis.charts.noData')}</p>}
        </ChartCard>
        
         <ChartCard title={t('analysis.charts.problematicEquipmentTitle')}>
          {problematicEquipmentData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={problematicEquipmentData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 141, 169, 0.2)" />
                <XAxis type="number" stroke="#E0E1DD" allowDecimals={false}/>
                <YAxis type="category" dataKey="name" stroke="#E0E1DD" width={120} tick={{ fontSize: 12 }}/>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(119, 141, 169, 0.2)' }} />
                <Bar dataKey="count" fill="#F97316" name={t('analysis.charts.count')} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-highlight pt-20">{t('analysis.charts.noData')}</p>}
        </ChartCard>
      </div>

      <ChartCard title={t('analysis.charts.mtbfTitle')}>
        {mtbfData.length > 0 ? (
            <ResponsiveContainer>
                <BarChart data={mtbfData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 141, 169, 0.2)" />
                    <XAxis dataKey="name" stroke="#E0E1DD" />
                    <YAxis stroke="#E0E1DD" />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(119, 141, 169, 0.2)' }} />
                    <Bar dataKey="mtbf" fill="#22C55E" name="MTBF" />
                </BarChart>
            </ResponsiveContainer>
        ) : <p className="text-center text-highlight pt-20">{t('analysis.charts.noData')}</p>}
      </ChartCard>
    </div>
  );
};

export default Analysis;
