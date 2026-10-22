import React from 'react';

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
}

export interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (tabId: string) => void;
    variant?: 'underline' | 'pills';
    className?: string;
}

export function Tabs({
    tabs,
    activeTab,
    onChange,
    variant = 'underline',
    className = '',
}: TabsProps) {
    if (variant === 'pills') {
        return (
            <div className={`flex flex-wrap gap-2 ${className}`} role="tablist">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onChange(tab.id)}
                            className={`
                                inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-md
                                transition-colors cursor-pointer min-h-[40px]
                                ${isActive 
                                    ? 'bg-orange text-white shadow-xs' 
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-charcoal'
                                }
                            `}
                        >
                            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={`border-b border-gray-200 ${className}`} role="tablist">
            <nav className="flex space-x-6 overflow-x-auto scrollbar-none" aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onChange(tab.id)}
                            className={`
                                inline-flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold whitespace-nowrap
                                transition-colors cursor-pointer min-h-[44px]
                                ${isActive
                                    ? 'border-orange text-orange font-bold'
                                    : 'border-transparent text-gray-500 hover:text-charcoal hover:border-gray-300'
                                }
                            `}
                        >
                            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-orange/10 text-orange' : 'bg-gray-100 text-gray-600'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}

export default Tabs;
