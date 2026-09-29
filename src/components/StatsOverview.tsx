import React from 'react';
import { InventoryStats } from '../types.ts';
import { Monitor, CheckCircle, AlertTriangle, XCircle, Archive, Cpu } from 'lucide-react';

interface StatsOverviewProps {
  stats: InventoryStats | null;
  onFilterStatus?: (status: string) => void;
  selectedStatus?: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  onFilterStatus,
  selectedStatus,
}) => {
  if (!stats) return null;

  const cards = [
    {
      title: 'Total All-in-One',
      value: stats.totalEquipos,
      icon: Monitor,
      color: 'text-slate-900',
      bg: 'bg-white',
      border: 'border-slate-200',
      badge: 'Equipos PC',
      filterKey: 'Todos',
    },
    {
      title: 'Operativos',
      value: stats.operativos,
      icon: CheckCircle,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      badge: 'En funcionamiento',
      filterKey: 'Operativo',
    },
    {
      title: 'En Mantenimiento',
      value: stats.enMantenimiento,
      icon: AlertTriangle,
      color: 'text-amber-700',
      bg: 'bg-amber-50/50',
      border: 'border-amber-200',
      badge: 'En revisión técnica',
      filterKey: 'En mantenimiento',
    },
    {
      title: 'Dañados / Desuso',
      value: stats.danados + stats.enBodega,
      icon: XCircle,
      color: 'text-rose-700',
      bg: 'bg-rose-50/50',
      border: 'border-rose-200',
      badge: 'Requiere atención',
      filterKey: stats.danados > 0 ? 'Dañado' : 'En bodega / Desuso',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        const isSelected = selectedStatus === card.filterKey;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onFilterStatus && onFilterStatus(card.filterKey)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
              card.bg
            } ${card.border} ${
              isSelected ? 'ring-2 ring-slate-800 shadow-sm' : 'hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">{card.title}</span>
              <IconComponent className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</span>
              <span className="text-xs font-medium text-slate-500">{card.badge}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
