'use client';

import React, { useState } from 'react';

interface DailyTrend {
    date: string;
    views: number;
    applications: number;
}

interface AnalyticsTrendChartProps {
    data: DailyTrend[];
}

export default function AnalyticsTrendChart({ data }: AnalyticsTrendChartProps) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                No trend data available for the last 30 days.
            </div>
        );
    }

    const maxViews = Math.max(...data.map((d) => d.views), 0);
    const maxApps = Math.max(...data.map((d) => d.applications), 0);
    const rawMax = Math.max(maxViews, maxApps);
    const maxY = rawMax === 0 ? 5 : Math.ceil(rawMax * 1.15);

    const width = 800;
    const height = 240;
    const padding = { top: 20, right: 20, bottom: 35, left: 45 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const getX = (index: number) => {
        if (data.length <= 1) return padding.left + chartWidth / 2;
        return padding.left + (index / (data.length - 1)) * chartWidth;
    };

    const getY = (val: number) => {
        return padding.top + chartHeight - (val / maxY) * chartHeight;
    };

    // Build SVG path
    const viewsPoints = data.map((d, i) => `${getX(i)},${getY(d.views)}`).join(' ');
    const appsPoints = data.map((d, i) => `${getX(i)},${getY(d.applications)}`).join(' ');

    const viewsAreaPoints = `${viewsPoints} ${padding.left + chartWidth},${padding.top + chartHeight} ${padding.left},${padding.top + chartHeight}`;
    const appsAreaPoints = `${appsPoints} ${padding.left + chartWidth},${padding.top + chartHeight} ${padding.left},${padding.top + chartHeight}`;

    // Format dates for X-axis: show ~5 intervals
    const step = Math.max(1, Math.floor(data.length / 5));
    const xLabels = data.filter((_, idx) => idx % step === 0 || idx === data.length - 1);

    const activePoint = hoverIndex !== null ? data[hoverIndex] : null;

    return (
        <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-5 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs" />
                        <span className="text-charcoal">Job Views</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange inline-block shadow-xs" />
                        <span className="text-charcoal">Applications</span>
                    </div>
                </div>

                {activePoint && (
                    <div className="text-xs bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg flex items-center gap-3">
                        <span className="text-gray-500 font-medium">{activePoint.date}</span>
                        <span className="text-emerald-700 font-bold">{activePoint.views} views</span>
                        <span className="text-orange font-bold">{activePoint.applications} applies</span>
                    </div>
                )}
            </div>

            <div className="relative w-full overflow-hidden">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto overflow-visible select-none"
                    onMouseLeave={() => setHoverIndex(null)}
                >
                    <defs>
                        <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="appsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff5722" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#ff5722" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Y-axis grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                        const yVal = Math.round(maxY * (1 - pct));
                        const yPos = padding.top + pct * chartHeight;
                        return (
                            <g key={idx}>
                                <line
                                    x1={padding.left}
                                    y1={yPos}
                                    x2={width - padding.right}
                                    y2={yPos}
                                    stroke="#e5e7eb"
                                    strokeDasharray={pct === 1 ? undefined : '3 3'}
                                    strokeWidth="1"
                                />
                                <text
                                    x={padding.left - 8}
                                    y={yPos + 4}
                                    fontSize="10"
                                    textAnchor="end"
                                    fill="#9ca3af"
                                >
                                    {yVal}
                                </text>
                            </g>
                        );
                    })}

                    {/* Views Area & Line */}
                    <polygon points={viewsAreaPoints} fill="url(#viewsGradient)" />
                    <polyline
                        points={viewsPoints}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Applications Area & Line */}
                    <polygon points={appsAreaPoints} fill="url(#appsGradient)" />
                    <polyline
                        points={appsPoints}
                        fill="none"
                        stroke="#ff5722"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* X-axis labels */}
                    {xLabels.map((item) => {
                        const originalIndex = data.findIndex((d) => d.date === item.date);
                        if (originalIndex === -1) return null;
                        const x = getX(originalIndex);
                        const parts = item.date.split('-');
                        const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : item.date;
                        return (
                            <text
                                key={item.date}
                                x={x}
                                y={height - 8}
                                fontSize="10"
                                textAnchor="middle"
                                fill="#9ca3af"
                            >
                                {label}
                            </text>
                        );
                    })}

                    {/* Interactive hover overlays */}
                    {data.map((d, i) => {
                        const x = getX(i);
                        const isHovered = hoverIndex === i;
                        return (
                            <g key={d.date} onMouseEnter={() => setHoverIndex(i)}>
                                <rect
                                    x={x - chartWidth / (data.length * 2)}
                                    y={padding.top}
                                    width={chartWidth / data.length}
                                    height={chartHeight}
                                    fill="transparent"
                                    className="cursor-pointer"
                                />
                                {isHovered && (
                                    <>
                                        <line
                                            x1={x}
                                            y1={padding.top}
                                            x2={x}
                                            y2={padding.top + chartHeight}
                                            stroke="#d1d5db"
                                            strokeWidth="1.5"
                                            strokeDasharray="2 2"
                                        />
                                        <circle
                                            cx={x}
                                            cy={getY(d.views)}
                                            r="4.5"
                                            fill="#10b981"
                                            stroke="#ffffff"
                                            strokeWidth="2"
                                        />
                                        <circle
                                            cx={x}
                                            cy={getY(d.applications)}
                                            r="4.5"
                                            fill="#ff5722"
                                            stroke="#ffffff"
                                            strokeWidth="2"
                                        />
                                    </>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
