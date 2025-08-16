
import React, { useMemo } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Equipment, ServiceOrder, EquipmentStatus, ServiceOrderStatus, MaintenanceType, User, Supplier, ChecklistTemplate } from '../types';
import Card from './Card';
import { WrenchScrewdriverIcon, ClipboardListIcon, UsersIcon, TruckIcon, ClipboardDocumentCheckIcon } from './icons';
import { useTranslation } from '../i18n/config';

interface DashboardProps {
  equipment: Equipment[];
  serviceOrders: ServiceOrder[];
  users: User[];
  suppliers: Supplier[];
  checklistTemplates: ChecklistTemplate[];
}

const statusColors: { [key in EquipmentStatus]: string } = {
  [EquipmentStatus.Operational]: '#22C55E', // green-500
  [EquipmentStatus.InMaintenance]: '#FBBF24', // amber-400
  [EquipmentStatus.NeedsRepair]: '#EF4444', // red-500
  [EquipmentStatus.Decommissioned]: '#6B7280', // gray-500
};

const typeColors: { [key: string]: string } = {
    Machinery: '#3B82F6', // brand blue
    Tooling: '#F97316', // orange-500
    Automation: '#8B5CF6', // violet-500
    Unknown: '#6B7280', // gray-500
};

const maintenanceTypeColors: { [key in MaintenanceType]: string } = {
    [MaintenanceType.Preventive]: '#3b82f6',
    [MaintenanceType.Corrective]: '#ef4444',
    [MaintenanceType.Predictive]: '#facc15',
    [MaintenanceType.Rehabilitation]: '#a855f7',
};

const Dashboard: React.FC<DashboardProps> = ({ equipment, serviceOrders, users, suppliers, checklistTemplates }) => {
  const { t, language } = useTranslation();

  const totalEquipment = equipment.length;
  const totalUsers = users.length;
  const totalSuppliers = suppliers.length;
  const totalChecklists = checklistTemplates.length;

  const activeServiceOrders = serviceOrders.filter(
    order => order.status === ServiceOrderStatus.Open || order.status === ServiceOrderStatus.InProgress
  ).length;

  const totalRehabCost = useMemo(() => {
    return serviceOrders
      .filter(o => o.type === MaintenanceType.Rehabilitation && o.status === ServiceOrderStatus.Completed && o.rehabilitationCost)
      .reduce((sum, o) => sum + (o.rehabilitationCost || 0), 0);
  }, [serviceOrders]);

  const equipmentStatusData = useMemo(() => Object.values(EquipmentStatus).map(status => ({
    name: t(`enums.equipmentStatus.${status}`),
    value: equipment.filter(e => e.status === status).length,
    key: status,
  })).filter(item => item.value > 0), [equipment, t]);

  const equipmentTypeData = useMemo(() => {
    const counts = equipment.reduce((acc, eq) => {
        const typeKey = eq.type || 'Unknown';
        acc[typeKey] = (acc[typeKey] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const typeKeyMap: Record<string, string> = {
        'Machinery': `equipment.tabs.machinery`,
        'Tooling': `equipment.tabs.tooling`,
        'Automation': `equipment.tabs.automation`,
    }

    return Object.entries(counts).map(([type, value]) => ({
        name: t(typeKeyMap[type] || type),
        value,
        key: type,
    }));
  }, [equipment, t]);
  
  const serviceOrdersByTypeData = useMemo(() => {
    return Object.values(MaintenanceType).map(type => ({
      name: t(`enums.maintenanceType.${type}`),
      count: serviceOrders.filter(so => so.type === type).length,
      key: type,
    }));
  }, [serviceOrders, t]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-secondary p-3 border border-accent rounded-md shadow-lg">
          <p className="label text-light">{`${label} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const currencyMap: Record<string, string> = {
    pt: 'BRL',
    en: 'USD',
    es: 'EUR'
  };
  const currency = currencyMap[language] || 'USD';

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title={t('dashboard.totalEquipment')} value={totalEquipment} icon={<WrenchScrewdriverIcon className="h-8 w-8" />} />
        <Card title={t('dashboard.activeServiceOrders')} value={activeServiceOrders} icon={<ClipboardListIcon className="h-8 w-8" />} colorClass="text-blue-400" />
        <Card title={t('dashboard.totalUsers')} value={totalUsers} icon={<UsersIcon className="h-8 w-8" />} colorClass="text-teal-400" />
        <Card title={t('dashboard.totalSuppliers')} value={totalSuppliers} icon={<TruckIcon className="h-8 w-8" />} colorClass="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent">
          <h3 className="text-xl font-bold text-light mb-4">{t('dashboard.equipmentStatus')}</h3>
          {equipmentStatusData.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                <PieChart>
                    <Pie
                    data={equipmentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    stroke="none"
                    >
                    {equipmentStatusData.map((entry) => (
                        <Cell key={`cell-${entry.key}`} fill={statusColors[entry.key as EquipmentStatus]} />
                    ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </div>
          ) : <p className="text-center text-highlight py-8">{t('dashboard.noProblematicEquipment')}</p>}
        </div>
        
        <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent">
          <h3 className="text-xl font-bold text-light mb-4">{t('dashboard.equipmentByType')}</h3>
          {equipmentTypeData.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                <PieChart>
                    <Pie
                    data={equipmentTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    stroke="none"
                    >
                    {equipmentTypeData.map((entry) => (
                        <Cell key={`cell-${entry.key}`} fill={typeColors[entry.key]} />
                    ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </div>
           ) : <p className="text-center text-highlight py-8">{t('dashboard.noProblematicEquipment')}</p>}
        </div>
      </div>
      
      <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent">
        <h3 className="text-xl font-bold text-light mb-4">{t('dashboard.serviceOrdersOverview')}</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart
                    data={serviceOrdersByTypeData}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 141, 169, 0.3)" />
                    <XAxis dataKey="name" stroke="#E0E1DD" tick={{fill: '#E0E1DD'}} />
                    <YAxis stroke="#E0E1DD" allowDecimals={false} />
                    <Tooltip
                        cursor={{fill: 'rgba(119, 141, 169, 0.2)'}}
                        content={<CustomTooltip />}
                    />
                    <Bar dataKey="count" barSize={50}>
                        {serviceOrdersByTypeData.map((entry) => (
                            <Cell key={`cell-${entry.key}`} fill={maintenanceTypeColors[entry.key]}/>
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t('dashboard.totalRehabCost')} value={totalRehabCost.toLocaleString(language, { style: 'currency', currency })} icon={<WrenchScrewdriverIcon className="h-8 w-8" />} colorClass="text-purple-400" />
        <Card title={t('dashboard.totalChecklists')} value={totalChecklists} icon={<ClipboardDocumentCheckIcon className="h-8 w-8" />} colorClass="text-yellow-400" />
      </div>
    </div>
  );
};

export default Dashboard;