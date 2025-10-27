
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MeasurementInstrument, InstrumentStatus } from '../types';
import { useTranslation } from '../i18n/config';

interface MetrologyAnalysisProps {
    instruments: MeasurementInstrument[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280', '#EC4899', '#14B8A6'];

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-primary p-6 rounded-lg shadow-md border border-accent">
    <h3 className="text-xl font-bold text-light mb-4">{title}</h3>
    <div className="w-full h-80">
      {children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (label) { // BarChart
        return (
          <div className="bg-secondary p-3 border border-accent rounded-md shadow-lg">
            <p className="label text-light font-bold mb-2">{label}</p>
             {payload.map((pld: any) => (
                <p key={pld.dataKey} style={{ color: pld.fill }}>
                {`${pld.name}: ${pld.value}`}
                </p>
            )).reverse()}
          </div>
        );
      }
      // PieChart
      return (
        <div className="bg-secondary p-3 border border-accent rounded-md shadow-lg">
          <p className="label text-light">{`${payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};


const MetrologyAnalysis: React.FC<MetrologyAnalysisProps> = ({ instruments }) => {
    const { t } = useTranslation();
    const [dueSoonDays, setDueSoonDays] = useState(30);

    const instrumentsByTypeData = useMemo(() => {
        const counts = instruments.reduce((acc, instrument) => {
            const name = instrument.name || 'Unknown';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [instruments]);

    const calibrationStatusData = useMemo(() => {
        const statuses = {
            ok: 0,
            dueSoon: 0,
            overdue: 0,
            inCalibration: 0,
            damaged: 0,
            retired: 0,
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateThreshold = new Date();
        dueDateThreshold.setDate(today.getDate() + dueSoonDays);

        instruments.forEach(instrument => {
            if (instrument.status === InstrumentStatus.Damaged) {
                statuses.damaged++;
            } else if (instrument.status === InstrumentStatus.Retired) {
                statuses.retired++;
            } else if (instrument.status === InstrumentStatus.InCalibration) {
                statuses.inCalibration++;
            } else if (instrument.nextCalibrationDate) {
                const dueDate = new Date(instrument.nextCalibrationDate + 'T00:00:00');
                if (dueDate < today) {
                    statuses.overdue++;
                } else if (dueDate <= dueDateThreshold) {
                    statuses.dueSoon++;
                } else {
                    statuses.ok++;
                }
            } else {
                statuses.ok++;
            }
        });

        return [
            { name: t('metrology.analysis.status.calibrated'), count: statuses.ok, fill: '#22C55E' },
            { name: t('metrology.analysis.status.pendingShipment'), count: statuses.dueSoon, fill: '#FBBF24' },
            { name: t('metrology.analysis.status.overdue'), count: statuses.overdue, fill: '#EF4444' },
            { name: t('metrology.analysis.status.inCalibration'), count: statuses.inCalibration, fill: '#3B82F6' },
            { name: t('metrology.analysis.status.damaged'), count: statuses.damaged, fill: '#A855F7' },
            { name: t('metrology.analysis.status.retired'), count: statuses.retired, fill: '#6B7280' },
        ].filter(item => item.count > 0);

    }, [instruments, t, dueSoonDays]);
    
    const instrumentsByLocationData = useMemo(() => {
        // FIX: Replaced Set spread with Array.from() to ensure correct type inference from Set to Array,
        // resolving an issue where the type was inferred as `unknown[]` instead of `string[]`.
        const instrumentNames: string[] = Array.from(new Set(instruments.map(i => i.name)));
        const locations: string[] = Array.from(new Set(instruments.map(i => i.location)));

        const data = locations.map(location => {
            const locationData: { location: string; [key: string]: string | number } = { location };
            const instrumentsAtLocation = instruments.filter(i => i.location === location);

            instrumentNames.forEach(name => {
                locationData[name] = instrumentsAtLocation.filter(i => i.name === name).length;
            });

            return locationData;
        });
        
        return { data, instrumentNames };

    }, [instruments]);


    return (
        <div className="space-y-6 pt-6">
            <div className="bg-primary p-4 rounded-lg shadow-md border border-accent">
                <h3 className="text-lg font-bold text-light mb-2">{t('metrology.analysis.settings.title')}</h3>
                <div className="flex items-center gap-4">
                    <label htmlFor="dueSoonDays" className="text-sm font-medium text-highlight">{t('metrology.analysis.settings.dueSoonDays')}</label>
                    <input
                        type="number"
                        id="dueSoonDays"
                        value={dueSoonDays}
                        onChange={(e) => setDueSoonDays(Number(e.target.value))}
                        className="w-24 bg-secondary border-accent rounded-md p-2 text-light focus:ring-brand focus:border-brand"
                        min="1"
                    />
                    <span className="text-sm text-highlight">{t('metrology.analysis.settings.days')}</span>
                </div>
            </div>
            
            <ChartCard title={t('metrology.analysis.byLocationTitle')}>
                {instrumentsByLocationData.data.length > 0 ? (
                    <ResponsiveContainer>
                        <BarChart data={instrumentsByLocationData.data} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 141, 169, 0.2)" />
                            <XAxis type="number" stroke="#E0E1DD" allowDecimals={false} />
                            <YAxis type="category" dataKey="location" stroke="#E0E1DD" width={110} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(119, 141, 169, 0.2)' }} />
                            <Legend />
                            {instrumentsByLocationData.instrumentNames.map((name, index) => (
                                <Bar key={name} dataKey={name} stackId="a" fill={COLORS[index % COLORS.length]} name={name} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                ) : <p className="text-center text-highlight pt-20">{t('analysis.charts.noData')}</p>}
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={t('metrology.analysis.byTypeTitle')}>
                    {instrumentsByTypeData.length > 0 ? (
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={instrumentsByTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    stroke="none"
                                >
                                    {instrumentsByTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-highlight pt-20">{t('analysis.charts.noData')}</p>}
                </ChartCard>
                 <ChartCard title={t('metrology.analysis.byStatusTitle')}>
                    {calibrationStatusData.length > 0 ? (
                        <ResponsiveContainer>
                            <BarChart data={calibrationStatusData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 141, 169, 0.2)" />
                                <XAxis dataKey="name" stroke="#E0E1DD" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                                <YAxis stroke="#E0E1DD" allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(119, 141, 169, 0.2)' }} />
                                <Bar dataKey="count" name={t('analysis.charts.count')}>
                                    {calibrationStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-highlight pt-20">{t('analysis.charts.noData')}</p>}
                </ChartCard>
            </div>
        </div>
    );
};

export default MetrologyAnalysis;
