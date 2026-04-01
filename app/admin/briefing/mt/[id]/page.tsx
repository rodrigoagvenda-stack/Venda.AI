'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, Save, ExternalLink, Upload, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Config {
  id: string;
  slug: string;
  company_name: string;
  logo_url: string;
  primary_color: string;
  welcome_title: string;
  welcome_message: string;
  success_message: string;
  webhook_url: string;
  webhook_secret: string;
  is_active: boolean;
}

interface Question {
  id?: string;
  label: string;
  field_key: string;
  question_type: string;
  options: { value: string; label: string }[];
  placeholder: string;
  is_required: boolean;
  order_index: number;
  _new?: boolean;
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Texto simples' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'radio', label: 'Múltipla escolha (radio)' },
  { value: 'select', label: 'Dropdown (select)' },
  { value: 'multiselect', label: 'Seleção múltipla' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'currency', label: 'Valor monetário' },
  { value: 'url', label: 'URL / Site' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const HAS_OPTIONS = ['radio', 'select', 'multiselect'];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BriefingMtEditPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/briefing/mt/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setConfig(data.config);
        setQuestions(
          (data.questions ?? []).map((q: Question) => ({ ...q, options: q.options ?? [] }))
        );
      } catch (err: any) {
        toast.error(err.message || 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ---------------------------------------------------------------------------
  // Config helpers
  // ---------------------------------------------------------------------------

  function updateConfig(field: string, value: unknown) {
    setConfig((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/briefing/mt/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Configuração salva!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('configId', id);
      const res = await fetch('/api/admin/briefing/mt/upload-logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateConfig('logo_url', data.logo_url);
      toast.success('Logo enviado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Question helpers
  // ---------------------------------------------------------------------------

  function addQuestion() {
    const newQ: Question = {
      label: '',
      field_key: `campo_${Date.now()}`,
      question_type: 'text',
      options: [],
      placeholder: '',
      is_required: true,
      order_index: questions.length,
      _new: true,
    };
    setQuestions((prev) => [...prev, newQ]);
    setExpandedQ(questions.length);
  }

  function updateQ(idx: number, field: string, value: unknown) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        const updated = { ...q, [field]: value };
        // Auto-popula field_key a partir do label se ainda não foi editado manualmente
        if (field === 'label' && typeof value === 'string') {
          const autoKey = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          if (!q.field_key || q.field_key.startsWith('campo_')) {
            updated.field_key = autoKey || q.field_key;
          }
        }
        return updated;
      })
    );
  }

  function removeQ(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order_index: i })));
    if (expandedQ === idx) setExpandedQ(null);
  }

  function addOption(qIdx: number) {
    const q = questions[qIdx];
    updateQ(qIdx, 'options', [...q.options, { value: '', label: '' }]);
  }

  function updateOption(qIdx: number, oIdx: number, field: 'value' | 'label', val: string) {
    const q = questions[qIdx];
    const opts = q.options.map((o, i) => (i === oIdx ? { ...o, [field]: val } : o));
    updateQ(qIdx, 'options', opts);
  }

  function removeOption(qIdx: number, oIdx: number) {
    const q = questions[qIdx];
    updateQ(qIdx, 'options', q.options.filter((_, i) => i !== oIdx));
  }

  async function saveQuestions() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/briefing/mt/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Update with server IDs
      setQuestions((data.questions ?? questions).map((q: Question) => ({ ...q, options: q.options ?? [], _new: false })));
      toast.success('Perguntas salvas!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar perguntas');
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/briefing/mt">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold truncate">{config.company_name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">/briefing/{config.slug}</span>
            <a href={`/briefing/${config.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <Badge variant={config.is_active ? 'default' : 'secondary'}>
          {config.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Config */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configuração</CardTitle>
          <Button size="sm" onClick={saveConfig} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
            Salvar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input value={config.company_name} onChange={(e) => updateConfig('company_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={config.slug} onChange={(e) => updateConfig('slug', e.target.value)} className="font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {config.logo_url ? (
                <div className="relative w-24 h-12 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.logo_url} alt="logo" className="max-h-10 max-w-[88px] object-contain" />
                  <button
                    onClick={() => updateConfig('logo_url', '')}
                    className="absolute top-0.5 right-0.5 bg-background rounded-full p-0.5 shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-12 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                  Sem logo
                </div>
              )}
              <Label
                htmlFor="logo-upload"
                className="cursor-pointer flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-border hover:bg-muted transition-colors"
              >
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingLogo ? 'Enviando...' : 'Escolher imagem'}
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo(file);
                  e.target.value = '';
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP ou SVG — máx. 2MB</p>
          </div>
          <div className="space-y-2">
            <Label>Cor primária</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.primary_color}
                onChange={(e) => updateConfig('primary_color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border"
              />
              <Input value={config.primary_color} onChange={(e) => updateConfig('primary_color', e.target.value)} className="font-mono w-32" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Título de boas-vindas</Label>
            <Input value={config.welcome_title} onChange={(e) => updateConfig('welcome_title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mensagem de boas-vindas</Label>
            <Textarea value={config.welcome_message} onChange={(e) => updateConfig('welcome_message', e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Mensagem de sucesso</Label>
            <Textarea value={config.success_message} onChange={(e) => updateConfig('success_message', e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input value={config.webhook_url} onChange={(e) => updateConfig('webhook_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <Input value={config.webhook_secret} onChange={(e) => updateConfig('webhook_secret', e.target.value)} placeholder="opcional" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={config.is_active} onCheckedChange={(v) => updateConfig('is_active', v)} />
            <Label>Formulário ativo</Label>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Perguntas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{questions.length} pergunta(s)</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addQuestion}>
              <Plus className="mr-2 h-3 w-3" /> Adicionar
            </Button>
            <Button size="sm" onClick={saveQuestions} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma pergunta ainda. Clique em "Adicionar" para começar.
            </p>
          )}

          {questions.map((q, idx) => (
            <div key={idx} className="border border-border rounded-lg overflow-hidden">
              {/* Question header row */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-mono text-muted-foreground w-6 flex-shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{q.label || <span className="text-muted-foreground italic">Sem label</span>}</p>
                  <p className="text-xs text-muted-foreground font-mono">{q.field_key || '—'} · {q.question_type}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!q.is_required && <Badge variant="outline" className="text-xs">Opcional</Badge>}
                  {q._new && <Badge variant="secondary" className="text-xs">Novo</Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); removeQ(idx); }}
                    className="text-destructive hover:text-destructive h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Expanded editor */}
              {expandedQ === idx && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Label da pergunta</Label>
                      <Input
                        value={q.label}
                        onChange={(e) => updateQ(idx, 'label', e.target.value)}
                        placeholder="Qual é o seu nome?"
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">Aceita {'{{field_key}}'} para interpolação</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Field key</Label>
                      <Input
                        value={q.field_key}
                        onChange={(e) => updateQ(idx, 'field_key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        placeholder="nome_responsavel"
                        className="text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Tipo de campo</Label>
                      <Select value={q.question_type} onValueChange={(v) => updateQ(idx, 'question_type', v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Placeholder</Label>
                      <Input
                        value={q.placeholder}
                        onChange={(e) => updateQ(idx, 'placeholder', e.target.value)}
                        placeholder="Digite aqui..."
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={q.is_required}
                      onCheckedChange={(v) => updateQ(idx, 'is_required', v)}
                    />
                    <Label className="text-xs">Obrigatório</Label>
                  </div>

                  {/* Options editor for radio/select/multiselect */}
                  {HAS_OPTIONS.includes(q.question_type) && (
                    <div className="space-y-2">
                      <Label className="text-xs">Opções</Label>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <Input
                            value={opt.value}
                            onChange={(e) => updateOption(idx, oIdx, 'value', e.target.value)}
                            placeholder="valor"
                            className="text-xs font-mono flex-1"
                          />
                          <Input
                            value={opt.label}
                            onChange={(e) => updateOption(idx, oIdx, 'label', e.target.value)}
                            placeholder="Label exibido"
                            className="text-xs flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(idx, oIdx)}
                            className="text-destructive hover:text-destructive h-7 w-7 p-0 flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addOption(idx)} className="text-xs">
                        <Plus className="mr-1 h-3 w-3" /> Opção
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
