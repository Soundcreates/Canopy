import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const ndviData = [
    { name: 'Jan', val: 0.65 },
    { name: 'Feb', val: 0.68 },
    { name: 'Mar', val: 0.72 },
    { name: 'Apr', val: 0.75 },
    { name: 'May', val: 0.74 },
    { name: 'Jun', val: 0.78 },
];

const carbonData = [
    { name: 'E398', val: 120 },
    { name: 'E399', val: 135 },
    { name: 'E400', val: 140 },
    { name: 'E401', val: 138 },
    { name: 'E402', val: 142 },
];

export const NDVIChart = () => (
    <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ndviData}>
                <defs>
                    <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0.5, 1]} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#11141a', borderColor: '#ffffff10', fontSize: '12px' }}
                    itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="val" stroke="#10b981" fillOpacity={1} fill="url(#colorNdvi)" strokeWidth={2} />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

export const CarbonChart = () => (
    <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={carbonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#11141a', borderColor: '#ffffff10', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="val" fill="#374151" radius={[2, 2, 0, 0]} activeBar={{ fill: '#10b981' }} />
                {/* Active bar color is tricky in standard recharts without cell styling, but simpler is fine */}
            </BarChart>
        </ResponsiveContainer>
    </div>
);
