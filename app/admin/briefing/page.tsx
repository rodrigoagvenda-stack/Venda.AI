'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Settings, Eye, FileText, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
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

  useEffect(() => { setCurrentPage(1); }, [search]);
  useEffect(() => { setCurrentPagePauta(1); }, [searchPauta]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-shimmer h-8 w-32 rounded-lg" />
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
          <p className="text-muted-foreground mt-1">
            Gerencie briefings e pautas
          </p>
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
                <p className="text-sm text-muted-foreground mt-1">
                  Formulário para novos clientes
                </p>
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
              <Button onClick={() => { navigator.clipboard.writeText(pautaUrl); toast.success('Link copiado!'); }} variant="outline" className="sm:w-auto">
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
                    <th className="text-left p-3 text-sm">Plataformas</th>
                    <th className="text-left p-3 text-sm">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPautas.map((pauta) => (
                    <tr key={pauta.id} className="border-b hover:bg-accent">
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pauta.tipo_pauta === 'social_media'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
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
                        {pauta.plataformas?.join(', ')}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {formatDateTime(pauta.submitted_at)}
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
                        <Link href={`/admin/briefing/${response.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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
    </div>
  );
}
