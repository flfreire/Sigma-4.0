
import React, { useState, useMemo } from 'react';
import { ServiceOrder, Equipment, MaintenanceType, ServiceOrderStatus } from '../types';
import Card from './Card';
import Modal from './Modal';
import { CalendarDaysIcon } from './icons';
import { useTranslation } from '../i18n/config';

interface PreventiveMaintenanceProps {
  serviceOrders: ServiceOrder[];
  equipment: Equipment[];
}

const PreventiveMaintenance: React.FC<PreventiveMaintenanceProps> = ({ serviceOrders, equipment }) => {
  const { t, language } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const preventiveOrders = useMemo(() => {
    return serviceOrders.filter(o => o.type === MaintenanceType.Preventive);
  }, [serviceOrders]);

  const monthlyStats = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const ordersInMonth = preventiveOrders.filter(order => {
      // Assuming scheduledDate is 'YYYY-MM-DD'. Need to parse carefully to avoid timezone issues.
      const orderDate = new Date(order.scheduledDate + 'T00:00:00');
      return orderDate.getMonth() === month && orderDate.getFullYear() === year;
    });
    const completed = ordersInMonth.filter(o => o.status === ServiceOrderStatus.Completed).length;
    return { scheduled: ordersInMonth.length, completed };
  }, [preventiveOrders, currentDate]);

  const eventsByDate = useMemo(() => {
    return preventiveOrders.reduce((acc, order) => {
      // order.scheduledDate is already in 'YYYY-MM-DD' format, safe to use as key
      const dateKey = order.scheduledDate;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(order);
      return acc;
    }, {} as Record<string, ServiceOrder[]>);
  }, [preventiveOrders]);

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };
  
  const toYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const dayNamesByLang: Record<string, string[]> = {
        en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    };
    const dayNames = dayNamesByLang[language] || dayNamesByLang['en'];
    const todayYYYYMMDD = toYYYYMMDD(new Date());

    return (
      <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent mt-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-full hover:bg-accent text-light">&lt;</button>
          <h3 className="text-xl font-bold text-light">{currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</h3>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-full hover:bg-accent text-light">&gt;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-highlight font-bold">
          {dayNames.map(day => <div key={day} className="py-2">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2 mt-2">
          {blanks.map((_, i) => <div key={`blank-${i}`} className="border border-transparent"></div>)}
          {days.map(day => {
            const dateKey = toYYYYMMDD(new Date(year, month, day));
            const dayEvents = eventsByDate[dateKey] || [];
            const isToday = todayYYYYMMDD === dateKey;
            
            return (
              <div key={day} onClick={() => handleDayClick(day)} className={`p-2 h-24 border rounded-md flex flex-col cursor-pointer transition-colors ${isToday ? 'border-brand' : 'border-accent'} hover:bg-accent`}>
                <span className={`font-semibold ${isToday ? 'text-brand' : 'text-light'}`}>{day}</span>
                {dayEvents.length > 0 && (
                  <div className="mt-auto text-center">
                    <span className="text-xs bg-brand text-white font-bold rounded-full w-6 h-6 flex items-center justify-center mx-auto">{dayEvents.length}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getEquipmentName = (id: string) => equipment.find(e => e.id === id)?.name || id;

  const selectedDayEvents = selectedDate ? eventsByDate[toYYYYMMDD(selectedDate)] || [] : [];
  
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t('preventive.scheduledThisMonth')} value={monthlyStats.scheduled} icon={<CalendarDaysIcon className="h-8 w-8" />} colorClass="text-blue-400" />
        <Card title={t('preventive.completedThisMonth')} value={monthlyStats.completed} icon={<CalendarDaysIcon className="h-8 w-8" />} colorClass="text-green-500" />
      </div>

      {renderCalendar()}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedDate ? t('preventive.modalTitle', { date: selectedDate.toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' }) }) : ''}>
        {selectedDayEvents.length > 0 ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            {selectedDayEvents.map(order => (
              <div key={order.id} className="bg-primary p-4 rounded-lg border border-accent">
                <p className="font-bold text-light">{getEquipmentName(order.equipmentId)}</p>
                <p className="text-sm text-highlight my-1">{order.description}</p>
                <div className="mt-2 text-xs flex justify-between items-center">
                   <span className="font-semibold">{t(`enums.serviceOrderStatus.${order.status}`)}</span>
                   <span className="font-mono bg-accent px-2 py-1 rounded">{order.id}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-highlight text-center py-8">{t('preventive.noEvents')}</p>
        )}
      </Modal>
    </div>
  );
};

export default PreventiveMaintenance;