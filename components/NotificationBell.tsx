import React, { useState, useMemo } from 'react';
import { BellIcon, ScaleIcon, WrenchScrewdriverIcon, ExclamationTriangleIcon } from './icons';
import { Notification, NotificationType } from '../types';
import { useTranslation } from '../i18n/config';

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
}

const getIconForType = (type: NotificationType) => {
    switch (type) {
        case 'calibration': return <ScaleIcon className="h-6 w-6 text-cyan-400" />;
        case 'maintenance': return <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-400" />;
        case 'failure': return <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />;
        default: return <BellIcon className="h-6 w-6 text-highlight" />;
    }
};

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, unreadCount, onNotificationClick, onMarkAllAsRead }) => {
    const { t, language } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    
    const timeFormatter = useMemo(() => new Intl.RelativeTimeFormat(language, { numeric: 'auto' }), [language]);

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diffSeconds = Math.round((timestamp - now) / 1000);
        const diffMinutes = Math.round(diffSeconds / 60);
        const diffHours = Math.round(diffMinutes / 60);
        const diffDays = Math.round(diffHours / 24);

        if (Math.abs(diffSeconds) < 60) return timeFormatter.format(diffSeconds, 'second');
        if (Math.abs(diffMinutes) < 60) return timeFormatter.format(diffMinutes, 'minute');
        if (Math.abs(diffHours) < 24) return timeFormatter.format(diffHours, 'hour');
        return timeFormatter.format(diffDays, 'day');
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                className="relative text-highlight hover:text-light p-2 rounded-full hover:bg-accent"
                aria-label={`${unreadCount} new notifications`}
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-secondary">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-secondary rounded-lg shadow-xl z-30 border border-accent overflow-hidden">
                    <div className="flex justify-between items-center p-3 border-b border-accent">
                        <h3 className="font-bold text-light">{t('notifications.title')}</h3>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkAllAsRead();
                            }}
                            className="text-sm text-brand hover:underline disabled:opacity-50"
                            disabled={unreadCount === 0}
                        >
                            {t('notifications.markAllAsRead')}
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            <ul>
                                {notifications.map(notif => (
                                    <li key={notif.id}>
                                        <button
                                            onClick={() => {
                                                onNotificationClick(notif);
                                                setIsOpen(false);
                                            }}
                                            className="w-full text-left p-3 hover:bg-accent transition-colors flex items-start gap-3"
                                        >
                                            {!notif.isRead && <div className="mt-2.5 w-2 h-2 rounded-full bg-brand flex-shrink-0"></div>}
                                            <div className={`flex-shrink-0 ${notif.isRead ? 'ml-4' : ''}`}>
                                                {getIconForType(notif.type)}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-light text-sm">{notif.title}</p>
                                                <p className="text-xs text-highlight">{notif.message}</p>
                                                <p className="text-xs text-gray-400 mt-1">{formatTime(notif.timestamp)}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-8 text-center text-highlight text-sm">{t('notifications.noNew')}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
