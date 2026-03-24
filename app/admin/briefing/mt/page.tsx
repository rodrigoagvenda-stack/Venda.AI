'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Settings, ExternalLink, Copy, Loader2 } from 'lucide-react';

interface Config {
  id: string;
  slug: string;
  company_name: string;
  primary_color: string;
  is_active: boolean;
  created_at: string;
}

export default function BriefingMtListPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchConfigs(); }, []);

  async function fetchConfigs() {
    try {
      const res = await fetch('/api/admin/briefing/mt');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setConfigs(data.data ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar briefings');
    } finally {
      setLoading(false);
    }
  }

  const filtered = configs.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  function copyLink(slug: string) {
    const url = `${window.location.origin}/briefing/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Briefings Multi-Tenant</h1>
          <p className="text-muted-foreground text-sm">Gerencie formulários por empresa</p>
        </div>
        <Link href="/admin/briefing/mt/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nova Config
          </Button>
        </Link>
      </div>

      <Input
        placeholder="Buscar por empresa ou slug..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
            <p>Nenhum briefing encontrado.</p>
            <Link href="/admin/briefing/mt/nova">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Criar primeiro briefing
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.primary_color }}
                    />
                    <CardTitle className="text-base truncate">{c.company_name}</CardTitle>
                  </div>
                  <Badge variant={c.is_active ? 'default' : 'secondary'} className="flex-shrink-0">
                    {c.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">/briefing/{c.slug}</p>
              </CardHeader>
              <CardContent className="pt-0 flex gap-2 mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => copyLink(c.slug)}
                >
                  <Copy className="mr-1 h-3 w-3" /> Copiar link
                </Button>
                <a href={`/briefing/${c.slug}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
                <Link href={`/admin/briefing/mt/${c.id}`}>
                  <Button size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
