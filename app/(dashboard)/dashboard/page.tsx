'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Target, TrendingUp, DollarSign } from 'lucide-react';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, isWithinInterval } from 'date-fns';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

import { MetricCard } from '@/components/dashboard/MetricCard';
import { FilterButtons, FilterPeriod } from '@/components/dashboard/FilterButtons';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { BarChartCustom } from '@/components/dashboard/BarChartCustom';
import { PieChartInteractive } from '@/components/dashboard/PieChartInteractive';
import { SalesFunnel } from '@/components/dashboard/SalesFunnel';

interface Lead {
  id: string;
  status: string;
  project_value: number;
  created_at: string;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeadsByPeriod();
  }, [selectedPeriod, dateRange, leads]);

  const fetchLeads = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData?.company_id) return;

      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, status, project_value, created_at')
        .eq('company_id', userData.company_id)
        .order('created_at', { ascending: true });

      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeadsByPeriod = () => {
    const now = new Date();
    let filtered = leads;

    if (selectedPeriod === 'custom') {
      if (dateRange?.from && dateRange?.to) {
        filtered = leads.filter((lead) => {
          const createdDate = new Date(lead.created_at);
          const updatedDate = new Date(lead.updated_at);

          // Incluir lead se foi criado OU atualizado (fechado) no período
          const createdInPeriod = isWithinInterval(createdDate, {
            start: dateRange.from!,
            end: endOfDay(dateRange.to!),
          });
          const updatedInPeriod = isWithinInterval(updatedDate, {
            start: dateRange.from!,
            end: endOfDay(dateRange.to!),
          });

          return createdInPeriod || updatedInPeriod;
        });
      }
    } else {
      const periodStarts = {
        today: startOfDay(now),
        week: startOfWeek(now, { weekStartsOn: 0 }),
        month: startOfMonth(now),
        year: startOfYear(now),
      };

      const periodStart = periodStarts[selectedPeriod as keyof typeof periodStarts];

      if (periodStart) {
        filtered = leads.filter((lead) => {
          const createdDate = new Date(lead.created_at);
          const updatedDate = new Date(lead.updated_at);

          // Incluir lead se foi criado OU atualizado (fechado) no período
          return createdDate >= periodStart || updatedDate >= periodStart;
        });
      }
    }

    setFilteredLeads(filtered);
  };

  const handlePeriodChange = (period: FilterPeriod) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setDateRange(undefined);
      setShowDatePicker(false);
    } else {
      setShowDatePicker(true);
    }
  };

  // Métricas
  const totalLeads = filteredLeads.length;
  const novosLeads = filteredLeads.filter((l) => l.status === 'Lead novo').length;
  const emAtendimento = filteredLeads.filter((l) =>
    l.status !== 'Fechado' && l.status !== 'Perdido'
  ).length;
  const fechados = filteredLeads.filter((l) => l.status === 'Fechado').length;
  const perdidos = filteredLeads.filter((l) => l.status === 'Perdido').length;
  const faturamento = filteredLeads
    .filter((l) => l.status === 'Fechado')
    .reduce((sum, l) => sum + (l.project_value || 0), 0);

  // Taxa de conversão: leads fechados / (leads fechados + perdidos)
  // Isso ignora leads que ainda estão em andamento
  const leadsFinalizados = fechados + perdidos;
  const taxaConversao = leadsFinalizados > 0 ? ((fechados / leadsFinalizados) * 100).toFixed(1) : '0.0';

  // Dados do gráfico de performance - ADAPTATIVO por período
  const generatePerformanceData = () => {
    const now = new Date();

    switch (selectedPeriod) {
      case 'today': {
        // HOJE: Mostrar 24 horas (0h-23h)
        const today = startOfDay(now);
        return Array.from({ length: 24 }, (_, i) => {
          const hourStart = new Date(today);
          hourStart.setHours(i, 0, 0, 0);
          const hourEnd = new Date(today);
          hourEnd.setHours(i, 59, 59, 999);

          // Leads criados nesta hora
          const leadsCreated = filteredLeads.filter((lead) => {
            const createdDate = new Date(lead.created_at);
            return createdDate >= hourStart && createdDate <= hourEnd;
          });

          // Leads fechados nesta hora (usar updated_at)
          const leadsClosed = filteredLeads.filter((lead) => {
            const updatedDate = new Date(lead.updated_at);
            return lead.status === 'Fechado' && updatedDate >= hourStart && updatedDate <= hourEnd;
          });

          return {
            name: `${i}h`,
            leads: leadsCreated.length,
            fechados: leadsClosed.length,
          };
        });
      }

      case 'week': {
        // SEMANA: Mostrar 7 dias
        return Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (6 - i));
          const dayStart = startOfDay(date);
          const dayEnd = endOfDay(date);
          const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });

          // Leads criados neste dia
          const leadsCreated = filteredLeads.filter((lead) => {
            const createdDate = new Date(lead.created_at);
            return createdDate >= dayStart && createdDate <= dayEnd;
          });

          // Leads fechados neste dia (usar updated_at)
          const leadsClosed = filteredLeads.filter((lead) => {
            const updatedDate = new Date(lead.updated_at);
            return lead.status === 'Fechado' && updatedDate >= dayStart && updatedDate <= dayEnd;
          });

          return {
            name: dayName,
            leads: leadsCreated.length,
            fechados: leadsClosed.length,
          };
        });
      }

      case 'month': {
        // MÊS: Mostrar semanas (4-5 semanas)
        const startOfMonthDate = startOfMonth(now);
        const weeks: { name: string; leads: number; fechados: number }[] = [];
        let weekNum = 1;

        for (let d = new Date(startOfMonthDate); d <= now; ) {
          const weekStart = new Date(d);
          const weekEnd = new Date(d);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          // Leads criados nesta semana
          const leadsCreated = filteredLeads.filter((lead) => {
            const createdDate = new Date(lead.created_at);
            return createdDate >= weekStart && createdDate <= weekEnd;
          });

          // Leads fechados nesta semana (usar updated_at)
          const leadsClosed = filteredLeads.filter((lead) => {
            const updatedDate = new Date(lead.updated_at);
            return lead.status === 'Fechado' && updatedDate >= weekStart && updatedDate <= weekEnd;
          });

          weeks.push({
            name: `Sem ${weekNum}`,
            leads: leadsCreated.length,
            fechados: leadsClosed.length,
          });

          d.setDate(d.getDate() + 7);
          weekNum++;
        }

        return weeks.length > 0 ? weeks : [{ name: 'Sem 1', leads: 0, fechados: 0 }];
      }

      case 'year': {
        // ANO: Mostrar 12 meses
        return Array.from({ length: 12 }, (_, i) => {
          const monthStart = new Date(now.getFullYear(), i, 1);
          const monthEnd = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59, 999);
          const monthName = monthStart.toLocaleDateString('pt-BR', { month: 'short' });

          // Leads criados neste mês
          const leadsCreated = filteredLeads.filter((lead) => {
            const createdDate = new Date(lead.created_at);
            return createdDate.getMonth() === i && createdDate.getFullYear() === now.getFullYear();
          });

          // Leads fechados neste mês (usar updated_at)
          const leadsClosed = filteredLeads.filter((lead) => {
            const updatedDate = new Date(lead.updated_at);
            return lead.status === 'Fechado' &&
              updatedDate.getMonth() === i &&
              updatedDate.getFullYear() === now.getFullYear();
          });

          return {
            name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            leads: leadsCreated.length,
            fechados: leadsClosed.length,
          };
        });
      }

      case 'custom': {
        // PERSONALIZADO: Baseado no intervalo selecionado
        if (!dateRange?.from || !dateRange?.to) {
          return [{ name: 'Selecione um período', leads: 0, fechados: 0 }];
        }

        const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Se intervalo <= 7 dias, mostrar por dia
        if (diffDays <= 7) {
          return Array.from({ length: diffDays + 1 }, (_, i) => {
            const date = new Date(dateRange.from!);
            date.setDate(date.getDate() + i);
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);
            const dayName = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            // Leads criados neste dia
            const leadsCreated = filteredLeads.filter((lead) => {
              const createdDate = new Date(lead.created_at);
              return createdDate >= dayStart && createdDate <= dayEnd;
            });

            // Leads fechados neste dia (usar updated_at)
            const leadsClosed = filteredLeads.filter((lead) => {
              const updatedDate = new Date(lead.updated_at);
              return lead.status === 'Fechado' && updatedDate >= dayStart && updatedDate <= dayEnd;
            });

            return {
              name: dayName,
              leads: leadsCreated.length,
              fechados: leadsClosed.length,
            };
          });
        }

        // Se intervalo > 7 dias, mostrar por semana
        const weeks: { name: string; leads: number; fechados: number }[] = [];
        let weekNum = 1;

        for (let d = new Date(dateRange.from); d <= dateRange.to; ) {
          const weekStart = new Date(d);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(d);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          if (weekEnd > dateRange.to) {
            weekEnd.setTime(dateRange.to.getTime());
            weekEnd.setHours(23, 59, 59, 999);
          }

          // Leads criados nesta semana
          const leadsCreated = filteredLeads.filter((lead) => {
            const createdDate = new Date(lead.created_at);
            return createdDate >= weekStart && createdDate <= weekEnd;
          });

          // Leads fechados nesta semana (usar updated_at)
          const leadsClosed = filteredLeads.filter((lead) => {
            const updatedDate = new Date(lead.updated_at);
            return lead.status === 'Fechado' && updatedDate >= weekStart && updatedDate <= weekEnd;
          });

          weeks.push({
            name: `Sem ${weekNum}`,
            leads: leadsCreated.length,
            fechados: leadsClosed.length,
          });

          d.setDate(d.getDate() + 7);
          weekNum++;
        }

        return weeks;
      }

      default:
        return [];
    }
  };

  const performanceData = generatePerformanceData();

  // Dados do donut de conversão
  const conversionData = [
    { name: 'Fechados', value: fechados, color: '#10b981' },
    { name: 'Perdidos', value: perdidos, color: '#ef4444' },
    { name: 'Em andamento', value: emAtendimento, color: 'hsl(var(--primary))' },
  ].filter(item => item.value > 0); // Remove itens com valor 0 para não aparecer no gráfico

  // Dados do funil
  const funnelStages = [
    {
      label: 'Lead novo',
      count: filteredLeads.filter((l) => l.status === 'Lead novo').length,
      color: 'bg-blue-500',
    },
    {
      label: 'Em contato',
      count: filteredLeads.filter((l) => l.status === 'Em contato').length,
      color: 'bg-yellow-500',
    },
    {
      label: 'Interessado',
      count: filteredLeads.filter((l) => l.status === 'Interessado').length,
      color: 'bg-orange-500',
    },
    {
      label: 'Proposta enviada',
      count: filteredLeads.filter((l) => l.status === 'Proposta enviada').length,
      color: 'bg-purple-500',
    },
    {
      label: 'Fechado',
      count: fechados,
      color: 'bg-zinc-700',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-shimmer h-8 w-48 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handlePeriodChange('today')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedPeriod === 'today'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => handlePeriodChange('week')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedPeriod === 'week'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedPeriod === 'month'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => handlePeriodChange('year')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedPeriod === 'year'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Ano
            </button>
            <button
              onClick={() => handlePeriodChange('custom')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedPeriod === 'custom'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Personalizado
            </button>
          </div>
          {showDatePicker && (
            <div className="w-full sm:w-auto">
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
          )}
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Novos leads"
          value={novosLeads}
          subtitle={`${novosLeads} novos leads`}
          icon={Users}
          format="number"
        />
        <MetricCard
          title="Em atendimento"
          value={emAtendimento}
          subtitle={`Leads em atendimento`}
          icon={Target}
          format="number"
        />
        <MetricCard
          title="Taxa de conversão"
          value={taxaConversao}
          subtitle={`Leads convertidos`}
          icon={TrendingUp}
          format="percentage"
        />
        <MetricCard
          title="Faturamento"
          value={faturamento}
          subtitle={`Faturamento em negócios`}
          icon={DollarSign}
          format="currency"
        />
      </div>

      {/* Performance e Taxa de Conversão */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BarChartCustom data={performanceData} />
        </div>
        <div>
          <PieChartInteractive data={conversionData} />
        </div>
      </div>

      {/* Funil de Vendas */}
      <SalesFunnel stages={funnelStages} totalLeads={totalLeads} />
    </div>
  );
}
