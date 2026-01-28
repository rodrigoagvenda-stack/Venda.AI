'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, FileText, ClipboardList } from 'lucide-react';
import { BriefingConfig } from '@/types/briefing';
import { PautaConfig } from '@/types/pauta';
import { formatDateTime } from '@/lib/utils/format';

export default function WebhookConfigPage() {
  const [loading, setLoading] = useState(true);

  // Briefing config
  const [savingBriefing, setSavingBriefing] = useState(false);
  const [testingBriefing, setTestingBriefing] = useState(false);
  const [briefingConfig, setBriefingConfig] = useState<Partial<BriefingConfig>>({
    webhook_url: '',
    webhook_secret: '',
    is_active: false,
  });

  // Pauta config
  const [savingPauta, setSavingPauta] = useState(false);
  const [testingPauta, setTestingPauta] = useState(false);
  const [pautaConfig, setPautaConfig] = useState<Partial<PautaConfig>>({
    webhook_url: '',
    webhook_secret: '',
    is_active: false,
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const [briefingRes, pautaRes] = await Promise.all([
        fetch('/api/briefing/config'),
        fetch('/api/pauta/config'),
      ]);

      const briefingData = await briefingRes.json();
      const pautaData = await pautaRes.json();

      if (briefingData.success) setBriefingConfig(briefingData.data || {});
      if (pautaData.success) setPautaConfig(pautaData.data || {});
    } catch (error: any) {
      console.error('Error fetching configs:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBriefing() {
    setSavingBriefing(true);
    try {
      const response = await fetch('/api/briefing/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(briefingConfig),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success('Webhook de Briefing salvo!');
      setBriefingConfig(data.data);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setSavingBriefing(false);
    }
  }

  async function handleSavePauta() {
    setSavingPauta(true);
    try {
      const response = await fetch('/api/pauta/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pautaConfig),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success('Webhook de Pauta salvo!');
      setPautaConfig(data.data);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setSavingPauta(false);
    }
  }

  async function handleTestBriefing() {
    setTestingBriefing(true);
    try {
      const response = await fetch('/api/briefing/config/test', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast.success('Webhook de Briefing testado com sucesso!');
      } else {
        toast.error('Falha ao testar webhook de Briefing');
      }
      await fetchConfigs();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao testar');
    } finally {
      setTestingBriefing(false);
    }
  }

  async function handleTestPauta() {
    setTestingPauta(true);
    try {
      const response = await fetch('/api/pauta/config/test', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast.success('Webhook de Pauta testado com sucesso!');
      } else {
        toast.error('Falha ao testar webhook de Pauta');
      }
      await fetchConfigs();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao testar');
    } finally {
      setTestingPauta(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Configuração de Webhooks</h1>
        <p className="text-muted-foreground mt-1">
          Configure webhooks separados para Briefing e Pauta
        </p>
      </div>

      {/* BRIEFING WEBHOOK */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Webhook do Briefing
          </CardTitle>
          <CardDescription>
            Notificações quando novos leads preencherem o formulário de briefing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="briefing_webhook_url">Webhook URL</Label>
            <Input
              id="briefing_webhook_url"
              type="url"
              placeholder="https://n8n.vendai.com/webhook/briefing"
              value={briefingConfig.webhook_url || ''}
              onChange={(e) => setBriefingConfig({ ...briefingConfig, webhook_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="briefing_webhook_secret">Secret (opcional)</Label>
            <Input
              id="briefing_webhook_secret"
              type="text"
              placeholder="seu-secret-aqui"
              value={briefingConfig.webhook_secret || ''}
              onChange={(e) => setBriefingConfig({ ...briefingConfig, webhook_secret: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Enviado no header x-webhook-secret
            </p>
          </div>

          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <Label>Ativar</Label>
              <p className="text-xs text-muted-foreground">
                Webhook chamado ao receber briefing
              </p>
            </div>
            <Switch
              checked={briefingConfig.is_active || false}
              onCheckedChange={(checked) => setBriefingConfig({ ...briefingConfig, is_active: checked })}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleTestBriefing} disabled={testingBriefing || !briefingConfig.webhook_url} variant="outline" size="sm">
              {testingBriefing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Testar'}
            </Button>
            <Button onClick={handleSaveBriefing} disabled={savingBriefing} size="sm">
              {savingBriefing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>

          {briefingConfig.last_test_at && (
            <div className="flex items-center gap-2 text-xs">
              {briefingConfig.last_test_status === 'success' ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className="text-muted-foreground">
                Último teste: {formatDateTime(briefingConfig.last_test_at)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAUTA WEBHOOK */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Webhook da Pauta
          </CardTitle>
          <CardDescription>
            Notificações quando CS preencher formulário de pauta (Social Media / Tráfego)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pauta_webhook_url">Webhook URL</Label>
            <Input
              id="pauta_webhook_url"
              type="url"
              placeholder="https://n8n.vendai.com/webhook/pauta"
              value={pautaConfig.webhook_url || ''}
              onChange={(e) => setPautaConfig({ ...pautaConfig, webhook_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pauta_webhook_secret">Secret (opcional)</Label>
            <Input
              id="pauta_webhook_secret"
              type="text"
              placeholder="seu-secret-aqui"
              value={pautaConfig.webhook_secret || ''}
              onChange={(e) => setPautaConfig({ ...pautaConfig, webhook_secret: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Enviado no header x-webhook-secret
            </p>
          </div>

          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <Label>Ativar</Label>
              <p className="text-xs text-muted-foreground">
                Webhook chamado ao receber pauta
              </p>
            </div>
            <Switch
              checked={pautaConfig.is_active || false}
              onCheckedChange={(checked) => setPautaConfig({ ...pautaConfig, is_active: checked })}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleTestPauta} disabled={testingPauta || !pautaConfig.webhook_url} variant="outline" size="sm">
              {testingPauta ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Testar'}
            </Button>
            <Button onClick={handleSavePauta} disabled={savingPauta} size="sm">
              {savingPauta ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>

          {pautaConfig.last_test_at && (
            <div className="flex items-center gap-2 text-xs">
              {pautaConfig.last_test_status === 'success' ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className="text-muted-foreground">
                Último teste: {formatDateTime(pautaConfig.last_test_at)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
