
import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Equipment, ServiceOrder, EquipmentStatus, ServiceOrderStatus, MaintenanceType, User, Partner, ChecklistTemplate } from '../types';
import Card from './Card';
import { WrenchScrewdriverIcon, ClipboardListIcon, UsersIcon, TruckIcon, ClipboardDocumentCheckIcon, ClockIcon } from './icons';
import { useTranslation } from '../i18n/config';

interface DashboardProps {
  equipment: Equipment[];
  serviceOrders: ServiceOrder[];
  users: User[];
  partners: Partner[];
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
    'Body in White': '#A78BFA', // violet-400
    Unknown: '#6B7280', // gray-500
};

const Dashboard: React.FC<DashboardProps> = ({ equipment, serviceOrders, users, partners, checklistTemplates }) => {
  const { t, language } = useTranslation();
  const [filterDate, setFilterDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAll, setShowAll] = useState<boolean>(true);

  const totalEquipment = equipment.length;
  const totalUsers = users.length;
  const totalPartners = partners.length;
  const totalChecklists = checklistTemplates.length;
  
  const filteredServiceOrders = useMemo(() => {
    if (showAll) {
      return serviceOrders;
    }
    if (!filterDate) {
      return serviceOrders;
    }
    const [year, month] = filterDate.split('-').map(Number);
    
    return serviceOrders.filter(order => {
      const orderDate = new Date(order.scheduledDate + 'T00:00:00');
      return orderDate.getFullYear() === year && orderDate.getMonth() === month - 1;
    });
  }, [serviceOrders, filterDate, showAll]);


  const activeServiceOrders = filteredServiceOrders.filter(
    order => order.status === ServiceOrderStatus.Open || order.status === ServiceOrderStatus.InProgress
  ).length;

  const totalRehabCost = useMemo(() => {
    return filteredServiceOrders
      .filter(o => o.type === MaintenanceType.Rehabilitation && o.status === ServiceOrderStatus.Completed && o.rehabilitationCost)
      .reduce((sum, o) => sum + (o.rehabilitationCost || 0), 0);
  }, [filteredServiceOrders]);

  const mtbfHours = useMemo(() => {
    const failures = filteredServiceOrders.filter(o => 
        o.type === MaintenanceType.Corrective && o.status === ServiceOrderStatus.Completed
    );
    
    if (failures.length === 0) {
      return null;
    }

    const equipmentWithFailures = [...new Set(failures.map(f => f.equipmentId))];
    const relevantEquipment = equipment.filter(e => equipmentWithFailures.includes(e.id));

    if (relevantEquipment.length === 0) {
      return null;
    }

    const totalUptimeMs = relevantEquipment.reduce((acc, eq) => {
      const uptime = new Date().getTime() - new Date(eq.installDate).getTime();
      return acc + uptime;
    }, 0);
    
    const totalUptimeHours = totalUptimeMs / (1000 * 60 * 60);

    return totalUptimeHours / failures.length;

  }, [filteredServiceOrders, equipment]);

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
        'Body in White': `equipment.tabs.bodyInWhite`,
    }

    return Object.entries(counts).map(([type, value]) => ({
        name: t(typeKeyMap[type] || type),
        value,
        key: type,
    }));
  }, [equipment, t]);
  
  const serviceOrdersByTypeData = useMemo(() => {
    return Object.values(MaintenanceType).map(type => {
      const ordersOfType = filteredServiceOrders.filter(so => so.type === type);
      const completed = ordersOfType.filter(so => so.status === ServiceOrderStatus.Completed).length;
      const pending = ordersOfType.length - completed;
      return {
        name: t(`enums.maintenanceType.${type}`),
        completed: completed,
        pending: pending,
        key: type,
      };
    });
  }, [filteredServiceOrders, t]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // If label is present, it's a BarChart.
      if (label) {
        return (
          <div className="bg-secondary p-3 border border-accent rounded-md shadow-lg">
            <p className="label text-light font-bold mb-2">{label}</p>
            {payload.map((pld: any) => (
               <p key={pld.dataKey} style={{ color: pld.fill }}>
                  {`${pld.name}: ${pld.value}`}
               </p>
            )).reverse()}
            <p className="text-highlight mt-1 pt-1 border-t border-accent/50 text-sm">
               Total: {payload.reduce((sum: number, pld: any) => sum + pld.value, 0)}
            </p>
          </div>
        );
      }
      // Otherwise, it's a PieChart.
      return (
        <div className="bg-secondary p-3 border border-accent rounded-md shadow-lg">
          <p className="label text-light">{`${payload[0].name} : ${payload[0].value}`}</p>
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
      <div className="bg-secondary p-4 rounded-lg shadow-md border border-accent flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-bold text-light">{t('dashboard.filterTitle')}</h3>
        <div className="flex items-center gap-4">
            <input
                type="month"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                disabled={showAll}
                className="bg-primary border border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand disabled:opacity-50"
            />
            <label className="flex items-center space-x-2 text-light cursor-pointer">
                <input
                    type="checkbox"
                    checked={showAll}
                    onChange={(e) => setShowAll(e.target.checked)}
                    className="rounded bg-primary border-accent text-brand focus:ring-brand"
                />
                <span>{t('dashboard.allMonths')}</span>
            </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title={t('dashboard.totalEquipment')} value={totalEquipment} icon={<WrenchScrewdriverIcon className="h-8 w-8" />} />
        <Card title={t('dashboard.activeServiceOrders')} value={activeServiceOrders} icon={<ClipboardListIcon className="h-8 w-8" />} colorClass="text-blue-400" />
        <Card title={t('dashboard.totalUsers')} value={totalUsers} icon={<UsersIcon className="h-8 w-8" />} colorClass="text-teal-400" />
        <Card title={t('dashboard.totalPartners')} value={totalPartners} icon={<TruckIcon className="h-8 w-8" />} colorClass="text-orange-400" />
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
                    label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
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
                    label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
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
                    <Legend />
                    <Bar dataKey="pending" stackId="a" fill="#FBBF24" name={t('dashboard.pending')} />
                    <Bar dataKey="completed" stackId="a" fill="#22C55E" name={t('dashboard.completed')} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title={t('dashboard.totalRehabCost')} value={totalRehabCost.toLocaleString(language, { style: 'currency', currency })} icon={<WrenchScrewdriverIcon className="h-8 w-8" />} colorClass="text-purple-400" />
        <Card title={t('dashboard.totalChecklists')} value={totalChecklists} icon={<ClipboardDocumentCheckIcon className="h-8 w-8" />} colorClass="text-yellow-400" />
        <Card 
            title={t('dashboard.mtbf')} 
            value={mtbfHours !== null ? `${mtbfHours.toFixed(0)} h` : 'N/A'} 
            icon={<ClockIcon className="h-8 w-8" />} 
            colorClass="text-cyan-400" 
        />
      </div>
    </div>
  );
};

export default Dashboard;
