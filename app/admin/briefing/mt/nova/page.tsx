'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function BriefingMtNovaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    slug: '',
    company_name: '',
    logo_url: '',
    primary_color: '#000000',
    welcome_title: 'Bem-vindo ao Briefing',
    welcome_message: 'Vamos conhecer melhor a sua empresa e entender como podemos ajudar.',
    success_message: 'Obrigado! Em breve entraremos em contato.',
    webhook_url: '',
    webhook_secret: '',
    is_active: true,
  });

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function slugify(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function handleSave() {
    if (!form.slug || !form.company_name) {
      toast.error('Slug e nome da empresa são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/briefing/mt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Briefing criado!');
      router.push(`/admin/briefing/mt/${data.data.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar briefing');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/briefing/mt">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Nova Config de Briefing</h1>
          <p className="text-muted-foreground text-sm">Crie um formulário para uma empresa</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Empresa *</Label>
            <Input
              value={form.company_name}
              onChange={(e) => {
                update('company_name', e.target.value);
                if (!form.slug) update('slug', slugify(e.target.value));
              }}
              placeholder="Empresa X"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug (URL) *</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">/briefing/</span>
              <Input
                value={form.slug}
                onChange={(e) => update('slug', slugify(e.target.value))}
                placeholder="empresa-x"
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={form.logo_url}
              onChange={(e) => update('logo_url', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Cor primária</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => update('primary_color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border"
              />
              <Input
                value={form.primary_color}
                onChange={(e) => update('primary_color', e.target.value)}
                className="font-mono w-32"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={(v) => update('is_active', v)} />
            <Label>Formulário ativo</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Textos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título de boas-vindas</Label>
            <Input value={form.welcome_title} onChange={(e) => update('welcome_title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mensagem de boas-vindas</Label>
            <Textarea value={form.welcome_message} onChange={(e) => update('welcome_message', e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Mensagem de sucesso</Label>
            <Textarea value={form.success_message} onChange={(e) => update('success_message', e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Webhook</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL do Webhook</Label>
            <Input value={form.webhook_url} onChange={(e) => update('webhook_url', e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Secret</Label>
            <Input value={form.webhook_secret} onChange={(e) => update('webhook_secret', e.target.value)} placeholder="opcional" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar e adicionar perguntas
        </Button>
        <Link href="/admin/briefing/mt">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>
    </div>
  );
}
