'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Copy,
  Settings,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';
import { BriefingResponse } from '@/types/briefing';
import { PautaResponse } from '@/types/pauta';
import { formatDateTime } from '@/lib/utils/format';
import { SimplePagination } from '@/components/ui/pagination-simple';

export default function BriefingListPage() {
  const [responses, setResponses] = useState<BriefingResponse[]>([]);
  const [pautas, setPautas] = useState<PautaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchPauta, setSearchPauta] = useState('');
  const [total, setTotal] = useState(0);
  const [totalPautas, setTotalPautas] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPagePauta, setCurrentPagePauta] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [viewingPauta, setViewingPauta] = useState<PautaResponse | null>(null);
  const [deletingBriefing, setDeletingBriefing] = useState<number | null>(null);
  const [deletingPauta, setDeletingPauta] = useState<number | null>(null);

  const formUrl = typeof window !== 'undefined' ? `${window.location.origin}/brief` : '';
  const pautaUrl = typeof window !== 'undefined' ? `${window.location.origin}/pauta` : '';

  useEffect(() => {
    fetchResponses();
  }, [search]);

  useEffect(() => {
    fetchPautas();
  }, [searchPauta]);

  async function fetchResponses() {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/briefing/responses?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setResponses(data.data || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      console.error('Error fetching responses:', error);
      toast.error(error.message || 'Erro ao carregar respostas');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPautas() {
    try {
      const params = new URLSearchParams();
      if (searchPauta) params.append('search', searchPauta);

      const response = await fetch(`/api/pauta/responses?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setPautas(data.data || []);
      setTotalPautas(data.total || 0);
    } catch (error: any) {
      console.error('Error fetching pautas:', error);
    }
  }

  async function handleDeleteBriefing(id: number) {
    try {
      const response = await fetch(`/api/briefing/responses/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      toast.success('Briefing excluído com sucesso');
      setDeletingBriefing(null);
      fetchResponses();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir briefing');
    }
  }

  async function handleDeletePauta(id: number) {
    try {
      const response = await fetch(`/api/pauta/responses/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      toast.success('Pauta excluída com sucesso');
      setDeletingPauta(null);
      setViewingPauta(null);
      fetchPautas();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir pauta');
    }
  }

  const copyFormUrl = () => {
    navigator.clipboard.writeText(formUrl);
    toast.success('Link copiado!');
  };

  // Pagination Briefing
  const totalPages = Math.ceil(responses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResponses = responses.slice(startIndex, startIndex + itemsPerPage);

  // Pagination Pauta
  const totalPagesPauta = Math.ceil(pautas.length / itemsPerPage);
  const startIndexPauta = (currentPagePauta - 1) * itemsPerPage;
  const paginatedPautas = pautas.slice(startIndexPauta, startIndexPauta + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);
  useEffect(() => {
    setCurrentPagePauta(1);
  }, [searchPauta]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Formulários
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie briefings e pautas</p>
        </div>
        <Link href="/admin/briefing/configuracoes">
          <Button variant="outline" className="w-full sm:w-auto">
            <Settings className="mr-2 h-4 w-4" />
            Configurar Webhook
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Link do Briefing</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Formulário para novos clientes</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input value={formUrl} readOnly className="font-mono text-xs sm:text-sm flex-1" />
              <Button onClick={copyFormUrl} variant="outline" className="sm:w-auto">
                <Copy className="h-4 w-4 sm:mr-0" />
                <span className="sm:hidden ml-2">Copiar Link</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Link da Pauta</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Formulário de pauta (Social Media / Tráfego)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input value={pautaUrl} readOnly className="font-mono text-xs sm:text-sm flex-1" />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(pautaUrl);
                  toast.success('Link copiado!');
                }}
                variant="outline"
                className="sm:w-auto"
              >
                <Copy className="h-4 w-4 sm:mr-0" />
                <span className="sm:hidden ml-2">Copiar Link</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PAUTAS */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Pautas ({totalPautas})
            </CardTitle>
            <Input
              placeholder="Buscar por cliente ou CS..."
              value={searchPauta}
              onChange={(e) => setSearchPauta(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {pautas.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma pauta encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm">Tipo</th>
                    <th className="text-left p-3 text-sm">Cliente</th>
                    <th className="text-left p-3 text-sm">CS</th>
                    <th className="text-left p-3 text-sm">Objetivos</th>
                    <th className="text-left p-3 text-sm">Data</th>
                    <th className="text-left p-3 text-sm">Webhook</th>
                    <th className="text-left p-3 text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPautas.map((pauta) => (
                    <tr key={pauta.id} className="border-b hover:bg-accent">
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            pauta.tipo_pauta === 'social_media'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}
                        >
                          {pauta.tipo_pauta === 'social_media' ? 'Social Media' : 'Tráfego'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-sm">{pauta.nome_cliente}</td>
                      <td className="p-3 text-sm">{pauta.nome_cs}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {pauta.objetivos?.slice(0, 2).join(', ')}
                        {pauta.objetivos?.length > 2 && '...'}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {formatDateTime(pauta.submitted_at)}
                      </td>
                      <td className="p-3">
                        {pauta.webhook_sent ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-500" />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingPauta(pauta)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingPauta(pauta.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {pautas.length > 0 && (
          <SimplePagination
            currentPage={currentPagePauta}
            totalPages={totalPagesPauta}
            onPageChange={setCurrentPagePauta}
            totalItems={pautas.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </Card>

      {/* BRIEFINGS */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Briefings ({total})
            </CardTitle>
            <Input
              placeholder="Buscar por nome, email ou empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma resposta encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm">Nome</th>
                    <th className="text-left p-3 text-sm">Empresa</th>
                    <th className="text-left p-3 text-sm">Email</th>
                    <th className="text-left p-3 text-sm">WhatsApp</th>
                    <th className="text-left p-3 text-sm">Data</th>
                    <th className="text-left p-3 text-sm">Webhook</th>
                    <th className="text-left p-3 text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResponses.map((response) => (
                    <tr key={response.id} className="border-b hover:bg-accent">
                      <td className="p-3 font-medium text-sm">{response.nome_responsavel}</td>
                      <td className="p-3 text-sm">{response.nome_empresa}</td>
                      <td className="p-3 text-sm text-muted-foreground">{response.email}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {response.country_code} {response.whatsapp}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {formatDateTime(response.submitted_at)}
                      </td>
                      <td className="p-3">
                        {response.webhook_sent ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-500" />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Link href={`/admin/briefing/${response.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingBriefing(response.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {responses.length > 0 && (
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={responses.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </Card>

      {/* Modal: View Pauta */}
      {viewingPauta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Detalhes da Pauta</h2>
              <Button variant="ghost" size="sm" onClick={() => setViewingPauta(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {viewingPauta.tipo_pauta === 'social_media' ? 'Social Media' : 'Tráfego Pago'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDateTime(viewingPauta.submitted_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{viewingPauta.nome_cliente}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CS Responsável</p>
                  <p className="font-medium">{viewingPauta.nome_cs}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Objetivos</p>
                <div className="flex flex-wrap gap-1">
                  {viewingPauta.objetivos?.map((obj, i) => (
                    <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                      {obj}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Plataformas</p>
                <div className="flex flex-wrap gap-1">
                  {viewingPauta.plataformas?.map((plat, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                      {plat}
                    </span>
                  ))}
                </div>
              </div>

              {viewingPauta.tipo_pauta === 'social_media' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantidade de Posts</p>
                      <p className="font-medium">{viewingPauta.quantidade_posts || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Precisa de Copy?</p>
                      <p className="font-medium">
                        {viewingPauta.precisa_copy === 'sim' ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Precisa de Legenda?</p>
                      <p className="font-medium">
                        {viewingPauta.precisa_legenda === 'sim' ? 'Sim' : 'Não'}
                      </p>
                    </div>
                  </div>
                  {viewingPauta.formatos_conteudo && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Formatos de Conteúdo</p>
                      <div className="flex flex-wrap gap-1">
                        {viewingPauta.formatos_conteudo.map((fmt, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs"
                          >
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {viewingPauta.tipo_pauta === 'trafego' && (
                <>
                  {viewingPauta.metricas && viewingPauta.metricas.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Métricas</p>
                      <div className="flex flex-wrap gap-1">
                        {viewingPauta.metricas.map((met, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs"
                          >
                            {met}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingPauta.campanha_especifica && (
                    <div>
                      <p className="text-xs text-muted-foreground">Campanha Específica</p>
                      <p className="font-medium">{viewingPauta.campanha_especifica}</p>
                    </div>
                  )}
                </>
              )}

              {viewingPauta.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm whitespace-pre-wrap">{viewingPauta.observacoes}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">Webhook:</p>
                {viewingPauta.webhook_sent ? (
                  <span className="flex items-center gap-1 text-green-500 text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Enviado em {formatDateTime(viewingPauta.webhook_sent_at || '')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <XCircle className="h-3 w-3" />
                    Não enviado
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeletingPauta(viewingPauta.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingPauta(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Briefing */}
      {deletingBriefing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-2">Excluir Briefing</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Tem certeza que deseja excluir este briefing? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingBriefing(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteBriefing(deletingBriefing)}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Pauta */}
      {deletingPauta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-2">Excluir Pauta</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Tem certeza que deseja excluir esta pauta? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPauta(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeletePauta(deletingPauta)}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
