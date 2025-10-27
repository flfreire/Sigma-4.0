

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { Partner, PartnerType, ServiceCategory } from '../types';
import { useTranslation } from '../i18n/config';

interface PartnerMapProps {
    partners: Partner[];
    serviceCategories: ServiceCategory[];
}

const PartnerMap: React.FC<PartnerMapProps> = ({ partners, serviceCategories }) => {
    const { t } = useTranslation();
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
    const [typeFilter, setTypeFilter] = useState<PartnerType | 'All'>('All');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [nearbyPartners, setNearbyPartners] = useState<(Partner & { distance: number })[]>([]);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [clickSearchActive, setClickSearchActive] = useState(true);

    const partnersWithCoords = useMemo(() => {
        return partners.filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');
    }, [partners]);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current && document.getElementById('partner-map-container')) {
            const map = L.map('partner-map-container').setView([-14.2350, -51.9253], 4); // Center of Brazil
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            mapRef.current = map;
            markersRef.current.addTo(map);

            // Use a timeout to ensure the map container has been sized before invalidating.
            // This fixes rendering issues when the map is in a hidden tab.
            setTimeout(() => {
                map.invalidateSize();
            }, 0);
        }
    }, []); // Run only once

    const findNearbyPartners = useCallback((latlng: L.LatLng) => {
        const sorted = partnersWithCoords
            .map(partner => ({
                ...partner,
                distance: latlng.distanceTo([partner.latitude!, partner.longitude!])
            }))
            .sort((a, b) => a.distance - b.distance);
        
        setNearbyPartners(sorted.slice(0, 5));
    }, [partnersWithCoords]);


    // Handle map clicks
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleClick = (e: L.LeafletMouseEvent) => {
            if (clickSearchActive) {
                findNearbyPartners(e.latlng);
            }
        };

        map.on('click', handleClick);

        return () => {
            map.off('click', handleClick);
        };
    }, [clickSearchActive, findNearbyPartners]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        markersRef.current.clearLayers();
        const filteredPartners = partnersWithCoords.filter(p => {
            const typeMatch = typeFilter === 'All' || p.type === typeFilter;
            const categoryMatch = categoryFilter === 'All' || (p.serviceCategoryIds || []).includes(categoryFilter);
            return typeMatch && categoryMatch;
        });
        
        filteredPartners.forEach(partner => {
            const marker = L.marker([partner.latitude!, partner.longitude!]);
            marker.bindPopup(`<b>${partner.name}</b><br>${t(`enums.partnerType.${partner.type}`)}<br>${partner.contactPerson}`);
            markersRef.current.addLayer(marker);
        });
    }, [partnersWithCoords, typeFilter, categoryFilter, t]);

    const handleFindNearMe = () => {
        setIsLoadingLocation(true);
        setClickSearchActive(false);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const userLocation = L.latLng(latitude, longitude);
                mapRef.current?.setView(userLocation, 13);
                findNearbyPartners(userLocation);
                setIsLoadingLocation(false);
                setTimeout(() => setClickSearchActive(true), 1000); // Re-enable click search after a delay
            },
            (error) => {
                alert(t('partners.map.geolocationError'));
                console.error(error);
                setIsLoadingLocation(false);
                setClickSearchActive(true);
            }
        );
    };

    return (
        <div className="space-y-4">
             <div className="bg-secondary p-4 rounded-lg shadow-md border border-accent flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="font-semibold text-highlight text-sm">{t('partners.map.filterByType')}</label>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="bg-primary border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand">
                            <option value="All">{t('partners.map.all')}</option>
                            <option value={PartnerType.Supplier}>{t(`enums.partnerType.${PartnerType.Supplier}`)}</option>
                            <option value={PartnerType.ServiceProvider}>{t(`enums.partnerType.${PartnerType.ServiceProvider}`)}</option>
                        </select>
                    </div>
                     <div className="flex items-center gap-2">
                        <label className="font-semibold text-highlight text-sm">{t('partners.map.filterByCategory')}</label>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-primary border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand">
                            <option value="All">{t('partners.map.all')}</option>
                            {serviceCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button onClick={handleFindNearMe} disabled={isLoadingLocation} className="bg-brand text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-500 flex justify-center items-center transition-colors">
                    {isLoadingLocation ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            {t('partners.map.searchingLocation')}
                        </>
                    ) : t('partners.map.findNearMe')}
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div id="partner-map-container" className="h-[60vh] lg:col-span-2 rounded-lg border-2 border-accent shadow-lg z-0"></div>
                <div className="bg-secondary p-4 rounded-lg shadow-md border border-accent">
                    <h3 className="text-lg font-bold text-light mb-2">{t('partners.map.nearbyPartners')}</h3>
                    <p className="text-sm text-highlight mb-4">{t('partners.map.searchByClick')}</p>
                    {nearbyPartners.length > 0 ? (
                        <ul className="space-y-3">
                            {nearbyPartners.map(p => (
                                <li key={p.id} className="bg-primary p-3 rounded-md border border-accent">
                                    <p className="font-semibold text-light">{p.name}</p>
                                    <p className="text-xs text-brand">{t(`enums.partnerType.${p.type}`)}</p>
                                    <p className="text-sm text-highlight mt-1">{(p.distance / 1000).toFixed(2)} km</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-highlight py-8">{t('partners.map.noNearby')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartnerMap;