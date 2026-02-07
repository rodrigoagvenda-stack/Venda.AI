'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/useUser';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LayoutGrid, Table as TableIcon, Pencil, Trash2, Search, Flame, User, Phone, DollarSign, Building2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '@/types/database.types';
import { SimplePagination } from '@/components/ui/pagination-simple';
import {
  DndContext,
  closestCorners,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente de card draggable para o Kanban
function SortableLeadCard({ lead, onEdit, onDelete }: { lead: Lead; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? 1.02 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Lead novo': return 'border-l-blue-500';
      case 'Em contato': return 'border-l-pink-500';
      case 'Interessado': return 'border-l-purple-500';
      case 'Proposta enviada': return 'border-l-cyan-500';
      case 'Fechado': return 'border-l-green-500';
      case 'Perdido': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'Alta': 'bg-red-500/20 text-red-700',
      'Média': 'bg-yellow-500/20 text-yellow-700',
      'Baixa': 'bg-gray-500/20 text-gray-700',
    };
    return colors[priority as keyof typeof colors] || colors['Baixa'];
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 border-l-4 ${getStatusColor(lead.status)} mb-2 h-[180px] flex flex-col`}>
        <CardContent className="p-3 flex flex-col h-full">
          {/* Header - Fixed */}
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-sm flex-1 pr-2 text-foreground line-clamp-1">{lead.company_name}</h4>
            <div className="flex gap-1 flex-shrink-0" style={{ pointerEvents: 'auto' }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-accent rounded-md"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onEdit();
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive rounded-md"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Content - Flex grow */}
          <div className="flex-1 flex flex-col gap-1.5 text-xs overflow-hidden">
            {lead.contact_name && (
              <div className="flex items-center gap-1 text-muted-foreground truncate">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.contact_name}</span>
              </div>
            )}

            {lead.whatsapp && (
              <div className="flex items-center gap-1 text-muted-foreground truncate">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.whatsapp}</span>
              </div>
            )}

            {lead.project_value && lead.project_value > 0 && (
              <div className="flex items-center gap-1 font-semibold text-primary">
                <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                R$ {lead.project_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            )}

            {lead.segment && (
              <div className="flex items-center gap-1 text-muted-foreground truncate">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.segment}</span>
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="flex items-center gap-1.5 mt-auto pt-2 border-t">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${getPriorityBadge(lead.priority || 'Baixa')}`}>
              {lead.priority}
            </span>
            {lead.nivel_interesse && (
              <span className="text-[10px] bg-orange-500/20 text-orange-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                {lead.nivel_interesse.includes('Quente') && <Flame className="h-2.5 w-2.5" />}
                {lead.nivel_interesse}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de coluna droppable - Design moderno com visual aprimorado
function DroppableColumn({
  id,
  title,
  count,
  totalValue,
  children,
}: {
  id: string;
  title: string;
  count: number;
  totalValue: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      status: id.replace('column-', ''),
    },
  });

  // Cores específicas para cada coluna do Kanban
  const getColumnColor = () => {
    const status = id.replace('column-', '');
    switch (status) {
      case 'Lead novo': return 'border-t-blue-500';
      case 'Em contato': return 'border-t-pink-500';
      case 'Interessado': return 'border-t-purple-500';
      case 'Proposta enviada': return 'border-t-cyan-500';
      case 'Fechado': return 'border-t-[#191919]';
      case 'Perdido': return 'border-t-red-500';
      default: return 'border-t-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`bg-card border-2 border-b-0 ${getColumnColor()} rounded-t-xl p-4 shadow-sm`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm text-foreground">{title}</h3>
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
            <span className="text-xs font-bold">{count}</span>
          </div>
        </div>
        {totalValue > 0 && (
          <div className="text-xs text-muted-foreground font-semibold">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 bg-secondary/30 border-2 border-t-0 border-border rounded-b-xl p-3 min-h-[400px] lg:min-h-[600px] transition-all duration-300 ${
          isOver ? 'bg-primary/5 border-primary ring-2 ring-primary/30 shadow-lg scale-[1.01]' : ''
        }`}
      >
        {children}
        {/* Espaço vazio para facilitar drop */}
        <div className="min-h-[100px]" />
      </div>
    </div>
  );
}

export default function CRMPage() {
  const { user, company, loading: userLoading } = useUser();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formStep, setFormStep] = useState<'basico' | 'contato' | 'detalhes'>('basico');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [priorityFilter, setPriorityFilter] = useState('Todas');
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<string | number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Seleção em massa
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    segment: '',
    website_or_instagram: '',
    whatsapp: '',
    email: '',
    priority: 'Média',
    status: 'Lead novo',
    nivel_interesse: 'Morno 🟡',
    import_source: 'Interno',
    project_value: 0,
    notes: '',
    cargo: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!userLoading && !hasFetched) {
      if (user?.company_id) {
        fetchLeads();
        setHasFetched(true);
      } else {
        setError('Usuário não configurado. Verifique o banco de dados.');
        setLoading(false);
        setHasFetched(true);
      }
    }
  }, [userLoading, user?.company_id, hasFetched]);

  async function fetchLeads() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('company_id', user?.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
    setOverId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setOverId(null);
    const { active, over } = event;
    setActiveDragId(null);

    console.group('🎯 DRAG & DROP DEBUG');
    console.log('Event:', event);
    console.log('Active ID:', active.id, 'Type:', typeof active.id);
    console.log('Over ID:', over?.id, 'Type:', typeof over?.id);
    console.log('Over Data:', over?.data);

    if (!over) {
      console.warn('❌ No drop target!');
      console.groupEnd();
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    // Determinar novo status
    let newStatus: Lead['status'] | null = null;

    // CASO 1: Drop direto na coluna (id = "column-{status}")
    if (String(overId).startsWith('column-')) {
      newStatus = String(overId).replace('column-', '') as Lead['status'];
      console.log('✅ Drop na COLUNA:', newStatus);
    }
    // CASO 2: Drop em outro card (pegar status do card de destino)
    else {
      const targetLead = leads.find(l => l.id === overId || String(l.id) === String(overId));
      if (targetLead) {
        newStatus = targetLead.status;
        console.log('✅ Drop no CARD. Usando status da coluna:', newStatus);
      } else {
        console.error('❌ Card de destino não encontrado:', overId);
      }
    }

    if (!newStatus) {
      console.error('❌ Não foi possível determinar o status de destino');
      console.groupEnd();
      return;
    }

    // Buscar lead sendo arrastado
    const lead = leads.find(l => l.id === activeId || String(l.id) === String(activeId));

    if (!lead) {
      console.error('❌ Lead arrastado não encontrado:', activeId);
      console.groupEnd();
      return;
    }

    if (lead.status === newStatus) {
      console.log('ℹ️ Lead já está neste status. Nada a fazer.');
      console.groupEnd();
      return;
    }

    console.log(`🔄 Movendo "${lead.company_name}" de "${lead.status}" → "${newStatus}"`);

    const oldStatus = lead.status;

    // Update otimista (atualiza UI imediatamente)
    setLeads(prevLeads => prevLeads.map(l =>
      (l.id === activeId || String(l.id) === String(activeId))
        ? { ...l, status: newStatus! }
        : l
    ));

    // Persistir no banco
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', lead.id);

      if (error) throw error;

      // Criar log de atividade
      if (user && company) {
        await supabase.from('activity_logs').insert({
          user_id: user.auth_user_id,
          company_id: company.id,
          action: 'lead_status_change',
          description: `Moveu lead "${lead.company_name}" para "${newStatus}"`,
          metadata: {
            lead_id: lead.id,
            old_status: oldStatus,
            new_status: newStatus,
            lead_name: lead.company_name,
            contact_name: lead.contact_name,
          },
        });
      }

      console.log('✅ Status atualizado no banco com sucesso!');
      toast.success(`Lead movido para "${newStatus}"!`);
      console.groupEnd();
    } catch (error) {
      console.error('❌ Erro ao atualizar no banco:', error);
      toast.error('Erro ao atualizar lead');
      // Reverter mudança otimista
      fetchLeads();
      console.groupEnd();
    }
  };

  const handleOpenModal = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        company_name: lead.company_name || '',
        contact_name: lead.contact_name || '',
        segment: lead.segment || '',
        website_or_instagram: lead.website_or_instagram || '',
        whatsapp: lead.whatsapp || '',
        email: lead.email || '',
        priority: lead.priority || 'Média',
        status: lead.status || 'Lead novo',
        nivel_interesse: lead.nivel_interesse || 'Morno 🟡',
        import_source: lead.import_source || 'Interno',
        project_value: lead.project_value || 0,
        notes: lead.notes || '',
        cargo: lead.cargo || '',
      });
    } else {
      setEditingLead(null);
      setFormData({
        company_name: '',
        contact_name: '',
        segment: '',
        website_or_instagram: '',
        whatsapp: '',
        email: '',
        priority: 'Média',
        status: 'Lead novo',
        nivel_interesse: 'Morno 🟡',
        import_source: 'Interno',
        project_value: 0,
        notes: '',
        cargo: '',
      });
    }
    setFormStep('basico');
    setShowModal(true);
  };

  const handleSaveLead = async () => {
    if (!formData.company_name.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }
    if (!formData.segment) {
      toast.error('Segmento é obrigatório');
      return;
    }

    try {
      const supabase = createClient();

      // Não enviar campos vazios para enums
      const leadData = {
        ...formData,
        company_id: user?.company_id,
        cargo: formData.cargo || null, // Enviar null ao invés de string vazia
      };

      if (editingLead) {
        // Update
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editingLead.id);

        if (error) throw error;
        toast.success(`Lead "${formData.company_name}" atualizado com sucesso!`);
      } else {
        // Insert
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);

        if (error) throw error;
        toast.success(`Lead "${formData.company_name}" adicionado com sucesso!`);
      }

      setShowModal(false);
      fetchLeads();
    } catch (error: any) {
      console.error('Error saving lead:', error);
      toast.error(error.message || 'Erro ao salvar lead');
    }
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', deletingLead.id);

      if (error) throw error;
      toast.success(`Lead "${deletingLead.company_name}" deletado com sucesso!`);
      setDeletingLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao deletar lead');
    }
  };

  // Funções de seleção em massa
  const handleSelectLead = (leadId: number) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(paginatedLeads.map(lead => lead.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLeads.length === 0) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', selectedLeads);

      if (error) throw error;
      toast.success(`${selectedLeads.length} lead(s) deletado(s) com sucesso!`);
      setSelectedLeads([]);
      setShowDeleteConfirmation(false);
      fetchLeads();
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error('Erro ao deletar leads');
    }
  };

  const exportToCSV = () => {
    try {
      // Cabeçalhos do CSV
      const headers = [
        'Nome da Empresa',
        'Nome do Contato',
        'Segmento',
        'Status',
        'Website/Instagram',
        'WhatsApp',
        'Email',
        'Prioridade',
        'Nível de Interesse',
        'Valor do Projeto',
        'Fonte de Importação',
        'Observações',
        'Data de Criação'
      ];

      // Converter leads para linhas CSV
      const rows = filteredLeads.map(lead => [
        lead.company_name || '',
        lead.contact_name || '',
        lead.segment || '',
        lead.status || '',
        lead.website_or_instagram || '',
        lead.whatsapp || '',
        lead.email || '',
        lead.priority || '',
        lead.nivel_interesse || '',
        lead.project_value ? `R$ ${lead.project_value.toFixed(2)}` : '',
        lead.import_source || '',
        lead.notes || '',
        lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : ''
      ]);

      // Escapar vírgulas e aspas nos valores
      const escapeCsvValue = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      // Montar CSV
      const csvContent = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map(row => row.map(escapeCsvValue).join(','))
      ].join('\n');

      // Criar blob e fazer download
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${filteredLeads.length} leads exportados com sucesso!`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erro ao exportar CSV');
    }
  };

  const columns = [
    { id: 'Lead novo', title: 'Lead novo' },
    { id: 'Em contato', title: 'Em contato' },
    { id: 'Interessado', title: 'Interessado' },
    { id: 'Proposta enviada', title: 'Proposta enviada' },
    { id: 'Fechado', title: 'Fechado' },
    { id: 'Perdido', title: 'Perdido' },
  ];

  const getLeadsByStatus = (status: string) => {
    return filteredLeads.filter((lead) => lead.status === status);
  };

  const getTotalValueByStatus = (status: string) => {
    return filteredLeads
      .filter((lead) => lead.status === status)
      .reduce((sum, lead) => sum + (lead.project_value || 0), 0);
  };

  // Filtros
  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'Todas' || lead.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Lead novo': return 'bg-blue-500/20 text-blue-700';
      case 'Em contato': return 'bg-pink-500/20 text-pink-700';
      case 'Interessado': return 'bg-purple-500/20 text-purple-700';
      case 'Proposta enviada': return 'bg-cyan-500/20 text-cyan-700';
      case 'Fechado': return 'bg-green-500/20 text-green-700';
      case 'Perdido': return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-500/20 text-red-700';
      case 'Média': return 'bg-yellow-500/20 text-yellow-700';
      case 'Baixa': return 'bg-gray-500/20 text-gray-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse h-8 w-32 bg-secondary rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus leads e oportunidades</p>
        </div>
        <Card className="border-red-500">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-red-500 font-semibold">❌ {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeLead = activeDragId ? leads.find(l => l.id === activeDragId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground mt-1">Planilha de Leads - Gerencie seus leads e oportunidades</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-orange-500 hover:bg-orange-600 w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Lead
        </Button>
      </div>

      {/* Filtros e View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {columns.map(col => (
                  <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || statusFilter !== 'Todos' || priorityFilter !== 'Todas') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('Todos');
                  setPriorityFilter('Todas');
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          {selectedLeads.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirmation(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Deletar {selectedLeads.length} selecionado(s)</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={filteredLeads.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="h-4 w-4 mr-2" />
            Tabela
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
          </Button>
        </div>
      </div>

      {/* Content */}
      {leads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum lead encontrado. Clique em "Adicionar Lead" para começar!
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        <>
          {/* Desktop Kanban */}
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {columns.map((column) => {
              const columnLeads = getLeadsByStatus(column.id);
              const columnTotalValue = getTotalValueByStatus(column.id);
              return (
                <DroppableColumn
                  key={column.id}
                  id={`column-${column.id}`}
                  title={column.title}
                  count={columnLeads.length}
                  totalValue={columnTotalValue}
                >
                  <SortableContext items={columnLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {columnLeads.map((lead) => (
                      <SortableLeadCard
                        key={lead.id}
                        lead={lead}
                        onEdit={() => handleOpenModal(lead)}
                        onDelete={() => setDeletingLead(lead)}
                      />
                    ))}
                  </SortableContext>
                </DroppableColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeLead ? (
              <Card className="cursor-grabbing shadow-2xl opacity-90 border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm">{activeLead.company_name}</h4>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Mobile Kanban - Vertical List with Status Selector */}
        <div className="md:hidden space-y-3">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm flex-1">{lead.company_name}</h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenModal(lead)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeletingLead(lead)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {lead.contact_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {lead.contact_name}
                    </p>
                  )}
                  {lead.whatsapp && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {lead.whatsapp}
                    </p>
                  )}
                  {lead.project_value && lead.project_value > 0 && (
                    <p className="text-sm font-semibold text-primary flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      R$ {lead.project_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}

                  {/* Status Selector */}
                  <div>
                    <Label htmlFor={`status-${lead.id}`} className="text-xs text-muted-foreground">
                      Status
                    </Label>
                    <Select
                      value={lead.status}
                      onValueChange={async (newStatus) => {
                        // Update optimistically
                        setLeads(prevLeads =>
                          prevLeads.map(l =>
                            l.id === lead.id ? { ...l, status: newStatus as Lead['status'] } : l
                          )
                        );

                        // Persist to database
                        try {
                          const supabase = createClient();
                          const oldStatus = lead.status;
                          const { error } = await supabase
                            .from('leads')
                            .update({ status: newStatus })
                            .eq('id', lead.id);

                          if (error) throw error;

                          // Criar log de atividade
                          if (user && company) {
                            await supabase.from('activity_logs').insert({
                              user_id: user.auth_user_id,
                              company_id: company.id,
                              action: 'lead_status_change',
                              description: `Alterou status do lead "${lead.company_name}" de "${oldStatus}" para "${newStatus}"`,
                              metadata: {
                                lead_id: lead.id,
                                old_status: oldStatus,
                                new_status: newStatus,
                                lead_name: lead.company_name,
                                contact_name: lead.contact_name,
                              },
                            });
                          }

                          toast.success(`Status atualizado para "${newStatus}"!`);
                        } catch (error) {
                          console.error('Error updating status:', error);
                          toast.error('Erro ao atualizar status');
                          fetchLeads(); // Revert on error
                        }
                      }}
                    >
                      <SelectTrigger id={`status-${lead.id}`} className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority and Interest Level */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lead.priority === 'Alta' ? 'bg-red-500/20 text-red-700' :
                      lead.priority === 'Média' ? 'bg-yellow-500/20 text-yellow-700' :
                      'bg-gray-500/20 text-gray-700'
                    }`}>
                      {lead.priority}
                    </span>
                    {lead.nivel_interesse && (
                      <span className="text-xs bg-orange-500/20 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                        {lead.nivel_interesse.includes('Quente') && <Flame className="h-3 w-3" />}
                        {lead.nivel_interesse}
                      </span>
                    )}
                  </div>

                  {/* Segment */}
                  {lead.segment && (
                    <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {lead.segment}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block border-0 shadow-none">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 w-12">
                        <input
                          type="checkbox"
                          checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Empresa</th>
                      <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Segmento</th>
                      <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Valor</th>
                      <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Contato</th>
                      <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground">Prioridade</th>
                      <th className="text-right px-4 py-3 font-medium text-xs text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeads.map((lead, index) => (
                      <tr
                        key={lead.id}
                        className="border-b hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => handleSelectLead(lead.id)}
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-sm">{lead.company_name}</p>
                            {lead.contact_name && (
                              <p className="text-xs text-muted-foreground mt-0.5">{lead.contact_name}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{lead.segment || '—'}</td>
                        <td className="px-4 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${getStatusBadgeColor(lead.status || '')}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {lead.project_value && lead.project_value > 0 ? (
                            <span className="text-sm font-medium">
                              R$ {lead.project_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-0.5">
                            {lead.whatsapp && (
                              <span className="text-xs text-muted-foreground">{lead.whatsapp}</span>
                            )}
                            {lead.website_or_instagram && (
                              <a
                                href={lead.website_or_instagram.startsWith('http') ? lead.website_or_instagram : `https://${lead.website_or_instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                Website
                              </a>
                            )}
                            {!lead.whatsapp && !lead.website_or_instagram && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${getPriorityBadgeColor(lead.priority || '')}`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenModal(lead)}
                              className="h-8 w-8 hover:bg-accent"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingLead(lead)}
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            {filteredLeads.length > 0 && (
              <SimplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            <div className="grid gap-4">
              {paginatedLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{lead.company_name}</h3>
                      {lead.contact_name && (
                        <p className="text-sm text-muted-foreground">{lead.contact_name}</p>
                      )}
                    </div>
                    {lead.priority && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadgeColor(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {lead.segment && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{lead.segment}</span>
                      </div>
                    )}
                    {lead.whatsapp && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{lead.whatsapp}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusBadgeColor(lead.status || '')}`}>
                      {lead.status}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(lead)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingLead(lead)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
            {filteredLeads.length > 0 && (
              <SimplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </>
      )}

      {/* Modal Adicionar/Editar Lead */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95%] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingLead ? `Editar Lead: ${editingLead.company_name}` : 'Adicionar Lead'}</DialogTitle>
          </DialogHeader>
          <Tabs value={formStep} onValueChange={(value) => setFormStep(value as 'basico' | 'contato' | 'detalhes')} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basico" disabled>
                <span className="sm:hidden">1</span>
                <span className="hidden sm:inline">1. Informações Básicas</span>
              </TabsTrigger>
              <TabsTrigger value="contato" disabled>
                <span className="sm:hidden">2</span>
                <span className="hidden sm:inline">2. Contato</span>
              </TabsTrigger>
              <TabsTrigger value="detalhes" disabled>
                <span className="sm:hidden">3</span>
                <span className="hidden sm:inline">3. Detalhes</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="company_name">Nome da Empresa *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Ex: Empresa XYZ Ltda"
                />
              </div>
              <div>
                <Label htmlFor="segment">Segmento *</Label>
                <Select value={formData.segment} onValueChange={(value) => setFormData({ ...formData, segment: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Saúde/Medicina">Saúde/Medicina</SelectItem>
                    <SelectItem value="Educação">Educação</SelectItem>
                    <SelectItem value="Alimentação">Alimentação</SelectItem>
                    <SelectItem value="Beleza/Estética">Beleza/Estética</SelectItem>
                    <SelectItem value="Imobiliária">Imobiliária</SelectItem>
                    <SelectItem value="Advocacia">Advocacia</SelectItem>
                    <SelectItem value="Consultoria">Consultoria</SelectItem>
                    <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="Moda/Fashion">Moda/Fashion</SelectItem>
                    <SelectItem value="Arquitetura">Arquitetura</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="website">Site/Instagram</Label>
                <Input
                  id="website"
                  value={formData.website_or_instagram}
                  onChange={(e) => setFormData({ ...formData, website_or_instagram: e.target.value })}
                  placeholder="Ex: https://exemplo.com.br ou @instagram"
                />
              </div>
            </TabsContent>

            <TabsContent value="contato" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="contact_name">Nome do Contato</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <Label htmlFor="cargo">Cargo</Label>
                <Select value={formData.cargo} onValueChange={(value) => setFormData({ ...formData, cargo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Proprietário/Dono">Proprietário/Dono</SelectItem>
                    <SelectItem value="Gerente Comercial">Gerente Comercial</SelectItem>
                    <SelectItem value="Vendedor">Vendedor</SelectItem>
                    <SelectItem value="Representante Comercial">Representante Comercial</SelectItem>
                    <SelectItem value="Consultor de Vendas">Consultor de Vendas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="Ex: +55 11 98765-4321"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: contato@empresa.com"
                />
              </div>
            </TabsContent>

            <TabsContent value="detalhes" className="space-y-4 mt-4">
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Estágio do Lead *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead novo">Lead novo</SelectItem>
                      <SelectItem value="Em contato">Em contato</SelectItem>
                      <SelectItem value="Interessado">Interessado</SelectItem>
                      <SelectItem value="Proposta enviada">Proposta enviada</SelectItem>
                      <SelectItem value="Fechado">Fechado</SelectItem>
                      <SelectItem value="Perdido">Perdido</SelectItem>
                      <SelectItem value="Remarketing">Remarketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nivel_interesse">Status do Lead *</Label>
                  <Select value={formData.nivel_interesse} onValueChange={(value) => setFormData({ ...formData, nivel_interesse: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quente 🔥">Quente 🔥</SelectItem>
                      <SelectItem value="Morno 🟡">Morno 🟡</SelectItem>
                      <SelectItem value="Frio ❄️">Frio ❄️</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioridade *</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="import_source">Fonte de Importação *</Label>
                  <Select value={formData.import_source} onValueChange={(value) => setFormData({ ...formData, import_source: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Interno">Interno</SelectItem>
                      <SelectItem value="PEG">PEG</SelectItem>
                      <SelectItem value="Linkedin">Linkedin</SelectItem>
                      <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                      <SelectItem value="Google Ads">Google Ads</SelectItem>
                      <SelectItem value="Site/Landing Page">Site/Landing Page</SelectItem>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="TikTok Ads">TikTok Ads</SelectItem>
                      <SelectItem value="E-mail Marketing">E-mail Marketing</SelectItem>
                      <SelectItem value="Evento/Feira">Evento/Feira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="project_value">Valor do Projeto (R$)</Label>
                <Input
                  id="project_value"
                  type="number"
                  value={formData.project_value}
                  onChange={(e) => setFormData({ ...formData, project_value: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 5000"
                />
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações sobre o lead..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-5">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            {formStep === 'basico' && (
              <Button
                onClick={() => {
                  if (!formData.company_name.trim()) {
                    toast.error('Nome da empresa é obrigatório');
                    return;
                  }
                  if (!formData.segment) {
                    toast.error('Segmento é obrigatório');
                    return;
                  }
                  setFormStep('contato');
                }}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Próximo
              </Button>
            )}
            {formStep === 'contato' && (
              <>
                <Button variant="outline" onClick={() => setFormStep('basico')}>
                  Voltar
                </Button>
                <Button onClick={() => setFormStep('detalhes')} className="bg-orange-500 hover:bg-orange-600">
                  Próximo
                </Button>
              </>
            )}
            {formStep === 'detalhes' && (
              <>
                <Button variant="outline" onClick={() => setFormStep('contato')}>
                  Voltar
                </Button>
                <Button onClick={handleSaveLead} className="bg-orange-500 hover:bg-orange-600">
                  {editingLead ? 'Atualizar' : 'Salvar'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para Delete Individual */}
      <AlertDialog open={!!deletingLead} onOpenChange={() => setDeletingLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o lead <strong>"{deletingLead?.company_name}"</strong>?
              {deletingLead?.contact_name && (
                <span> (Contato: {deletingLead.contact_name})</span>
              )}
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              className="bg-red-500 hover:bg-red-600"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog para Delete em Massa */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Leads Selecionados</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar <strong>{selectedLeads.length} lead(s)</strong> selecionado(s)?
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirmation(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-red-500 hover:bg-red-600"
            >
              Deletar {selectedLeads.length} Lead(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
