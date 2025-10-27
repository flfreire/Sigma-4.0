
import { useState, useEffect, useMemo } from 'react';
import { Equipment, ServiceOrder, MeasurementInstrument, MaintenanceType, ServiceOrderStatus, Notification, InstrumentStatus } from '../types';
import { useTranslation } from '../i18n/config';

const CALIBRATION_ALERT_DAYS = 30;
const MAINTENANCE_ALERT_DAYS = 7;
const RECURRING_FAILURE_MONTHS = 3;
const RECURRING_FAILURE_THRESHOLD = 3;
const LOCAL_STORAGE_KEY = 'sigma-read-notification-ids';

interface NotificationSourceData {
    equipment: Equipment[];
    serviceOrders: ServiceOrder[];
    instruments: MeasurementInstrument[];
}

const getReadIds = (): Set<string> => {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
        console.error("Failed to parse read notification IDs from localStorage", error);
        return new Set();
    }
};

export const useNotifications = (data: NotificationSourceData) => {
    const { t, language } = useTranslation();
    const [readIds, setReadIds] = useState<Set<string>>(getReadIds);

    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...readIds]));
        } catch (error) {
            console.error("Failed to save read notification IDs to localStorage", error);
        }
    }, [readIds]);

    const allNotifications = useMemo(() => {
        const generated: Omit<Notification, 'isRead'>[] = [];
        const { equipment, serviceOrders, instruments } = data;

        // 1. Calibration Notifications
        const calToday = new Date();
        calToday.setHours(0, 0, 0, 0);
        instruments.forEach(inst => {
            if (inst.status === InstrumentStatus.Active && inst.nextCalibrationDate) {
                const dueDate = new Date(inst.nextCalibrationDate + 'T00:00:00');
                const diffTime = dueDate.getTime() - calToday.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const formattedDate = dueDate.toLocaleDateString(language);

                if (diffDays < 0) {
                    generated.push({
                        id: `cal-overdue-${inst.id}`,
                        type: 'calibration',
                        title: t('notifications.calibrationOverdue'),
                        message: t('notifications.message.calibrationOverdue', { name: inst.name, id: inst.id, date: formattedDate }),
                        timestamp: Date.now(),
                        link: { view: 'metrology', focusId: inst.id },
                    });
                } else if (diffDays <= CALIBRATION_ALERT_DAYS) {
                    generated.push({
                        id: `cal-due-${inst.id}`,
                        type: 'calibration',
                        title: t('notifications.calibrationDue'),
                        message: t('notifications.message.calibrationDue', { name: inst.name, id: inst.id, date: formattedDate }),
                        timestamp: Date.now(),
                        link: { view: 'metrology', focusId: inst.id },
                    });
                }
            }
        });

        // 2. Preventive Maintenance Notifications
        const maintToday = new Date();
        maintToday.setHours(0, 0, 0, 0);
        equipment.forEach(eq => {
            if (eq.nextPreventiveMaintenanceDate) {
                const dueDate = new Date(eq.nextPreventiveMaintenanceDate + 'T00:00:00');
                const diffTime = dueDate.getTime() - maintToday.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 const formattedDate = dueDate.toLocaleDateString(language);

                if (diffDays <= MAINTENANCE_ALERT_DAYS && diffDays >= 0) {
                     generated.push({
                        id: `maint-due-${eq.id}-${eq.nextPreventiveMaintenanceDate}`,
                        type: 'maintenance',
                        title: t('notifications.maintenanceDue'),
                        message: t('notifications.message.maintenanceDue', { name: eq.name, id: eq.id, date: formattedDate }),
                        timestamp: Date.now(),
                        link: { view: 'equipment', focusId: eq.id },
                    });
                }
            }
        });

        // 3. Recurring Failure Notifications
        const failureTimeframe = new Date();
        failureTimeframe.setMonth(failureTimeframe.getMonth() - RECURRING_FAILURE_MONTHS);

        const correctiveOrders = serviceOrders.filter(so => 
            so.type === MaintenanceType.Corrective &&
            so.status === ServiceOrderStatus.Completed &&
            so.closedDate && new Date(so.closedDate) > failureTimeframe
        );

        const failuresByEquipment = correctiveOrders.reduce((acc, so) => {
            acc[so.equipmentId] = (acc[so.equipmentId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        Object.entries(failuresByEquipment).forEach(([equipmentId, count]) => {
// FIX: Explicitly cast count to Number to avoid potential type errors during comparison.
            if (Number(count) >= RECURRING_FAILURE_THRESHOLD) {
                const eq = equipment.find(e => e.id === equipmentId);
                if (eq) {
                    generated.push({
                        id: `failure-${equipmentId}`,
                        type: 'failure',
                        title: t('notifications.recurringFailure'),
                        message: t('notifications.message.recurringFailure', { name: eq.name, id: eq.id, count: String(count) }),
                        timestamp: Date.now(),
                        link: { view: 'equipment', focusId: eq.id },
                    });
                }
            }
        });

        return generated
// FIX: Add an explicit type annotation to the map callback to ensure correct type inference for the sort function.
            .map((n): Notification => ({ ...n, isRead: readIds.has(n.id) }))
            .sort((a, b) => {
                if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
                return b.timestamp - a.timestamp;
            });

    }, [data, readIds, t, language]);

    const unreadCount = useMemo(() => {
        return allNotifications.filter(n => !n.isRead).length;
    }, [allNotifications]);

    const markAsRead = (id: string) => {
        setReadIds(prev => new Set(prev).add(id));
    };

    const markAllAsRead = () => {
        const allCurrentIds = allNotifications.map(n => n.id);
        setReadIds(prev => new Set([...prev, ...allCurrentIds]));
    };

    return {
        notifications: allNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
    };
};
