'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, FileText, ClipboardList } from 'lucide-react';
import { BriefingConfig, PautaConfig } from '@/types/briefing';
import { formatDateTime } from '@/lib/utils/format';

export default function WebhooksConfigPage() {
  const [loading, setLoading] = useState(true);

  // Briefing state
  const [savingBriefing, setSavingBriefing] = useState(false);
  const [testingBriefing, setTestingBriefing] = useState(false);
  const [briefingConfig, setBriefingConfig] = useState<Partial<BriefingConfig>>({
    webhook_url: '',
    webhook_secret: '',
    is_active: false,
  });

  // Pauta state
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

      if (briefingRes.ok && briefingData.data) {
        setBriefingConfig(briefingData.data);
      }

      if (pautaRes.ok && pautaData.data) {
        setPautaConfig(pautaData.data);
      }
    } catch (error: any) {
      console.error('Error fetching configs:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  // Briefing handlers
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

      toast.success('Webhook de briefing salvo com sucesso!');
      setBriefingConfig(data.data);
    } catch (error: any) {
      console.error('Error saving briefing config:', error);
      toast.error(error.message || 'Erro ao salvar configuração');
    } finally {
      setSavingBriefing(false);
    }
  }

  async function handleTestBriefing() {
    setTestingBriefing(true);
    try {
      const response = await fetch('/api/briefing/config/test', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Webhook de briefing testado com sucesso!');
      } else {
        toast.error(data.message || 'Falha ao testar webhook');
      }

      await fetchConfigs();
    } catch (error: any) {
      console.error('Error testing briefing webhook:', error);
      toast.error(error.message || 'Erro ao testar webhook');
    } finally {
      setTestingBriefing(false);
    }
  }

  // Pauta handlers
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

      toast.success('Webhook de pauta salvo com sucesso!');
      setPautaConfig(data.data);
    } catch (error: any) {
      console.error('Error saving pauta config:', error);
      toast.error(error.message || 'Erro ao salvar configuração');
    } finally {
      setSavingPauta(false);
    }
  }

  async function handleTestPauta() {
    setTestingPauta(true);
    try {
      const response = await fetch('/api/pauta/config/test', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Webhook de pauta testado com sucesso!');
      } else {
        toast.error(data.message || 'Falha ao testar webhook');
      }

      await fetchConfigs();
    } catch (error: any) {
      console.error('Error testing pauta webhook:', error);
      toast.error(error.message || 'Erro ao testar webhook');
    } finally {
      setTestingPauta(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Configuracoes de Webhooks</h1>
        <p className="text-muted-foreground mt-1">
          Configure os webhooks para receber notificacoes
        </p>
      </div>

      {/* Webhook do Briefing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Webhook do Briefing</CardTitle>
          </div>
          <CardDescription>
            Notificacoes quando leads preencherem o formulario de briefing
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

          <div className="flex items-center justify-between border rounded-lg p-4">
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

          <div className="flex gap-2">
            <Button onClick={handleTestBriefing} disabled={testingBriefing || !briefingConfig.webhook_url} variant="outline">
              {testingBriefing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar'
              )}
            </Button>
            <Button onClick={handleSaveBriefing} disabled={savingBriefing}>
              {savingBriefing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>

          {briefingConfig.last_test_at && (
            <div className="flex items-center gap-2 text-sm">
              {briefingConfig.last_test_status === 'success' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Ultimo teste: Sucesso</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">Ultimo teste: Falha</span>
                </>
              )}
              <span className="text-muted-foreground">
                ({formatDateTime(briefingConfig.last_test_at)})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook da Pauta */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle>Webhook da Pauta</CardTitle>
          </div>
          <CardDescription>
            Notificacoes quando CS preencher formulario de pauta (Social Media / Trafego)
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

          <div className="flex items-center justify-between border rounded-lg p-4">
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

          <div className="flex gap-2">
            <Button onClick={handleTestPauta} disabled={testingPauta || !pautaConfig.webhook_url} variant="outline">
              {testingPauta ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar'
              )}
            </Button>
            <Button onClick={handleSavePauta} disabled={savingPauta}>
              {savingPauta ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>

          {pautaConfig.last_test_at && (
            <div className="flex items-center gap-2 text-sm">
              {pautaConfig.last_test_status === 'success' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">Ultimo teste: Sucesso</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">Ultimo teste: Falha</span>
                </>
              )}
              <span className="text-muted-foreground">
                ({formatDateTime(pautaConfig.last_test_at)})
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
