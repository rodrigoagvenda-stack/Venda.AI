'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BriefingConfig {
  id: string;
  slug: string;
  company_name: string;
  logo_url?: string;
  primary_color: string;
  welcome_title: string;
  welcome_message: string;
  success_message: string;
}

interface BriefingQuestion {
  id: string;
  label: string;
  field_key: string;
  question_type: 'text' | 'textarea' | 'select' | 'radio' | 'multiselect' | 'checkbox' | 'currency' | 'url' | 'whatsapp';
  options?: { value: string; label: string }[];
  placeholder?: string;
  is_required: boolean;
  order_index: number;
}

// ---------------------------------------------------------------------------
// Label interpolation helper
// ---------------------------------------------------------------------------

function interpolate(label: string, answers: Record<string, unknown>): string {
  return label.replace(/\{\{(\w+)\}\}/g, (_, key) => String(answers[key] ?? ''));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BriefingSlugPage() {
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [config, setConfig] = useState<BriefingConfig | null>(null);
  const [questions, setQuestions] = useState<BriefingQuestion[]>([]);

  // step: -1 = welcome, 0..N-1 = questions, N = success
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WhatsApp country code state
  const [countryCode, setCountryCode] = useState('+55');

  // ---------------------------------------------------------------------------
  // Fetch form config
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/briefing/public/${slug}`);
        const data = await res.json();
        if (!res.ok || !data.success) { setNotFound(true); return; }
        setConfig(data.config);
        setQuestions(data.questions);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const current = questions[step] ?? null;
  const total = questions.length;
  const progress = step < 0 ? 0 : ((step + 1) / total) * 100;

  const updateAnswer = useCallback((key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const currentValue = current ? answers[current.field_key] : undefined;

  const isValid = useCallback(() => {
    if (!current) return true;
    if (!current.is_required) return true;
    const val = answers[current.field_key];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (current.question_type === 'whatsapp') {
      return String(val).replace(/\D/g, '').length >= 10;
    }
    return true;
  }, [current, answers]);

  const advance = useCallback(() => {
    if (!isValid()) {
      toast.error('Por favor, preencha este campo antes de continuar');
      return;
    }
    setStep((s) => s + 1);
  }, [isValid]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isSubmitting) {
        e.preventDefault();
        if (step === total - 1) handleSubmit();
        else advance();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, total, isSubmitting, advance]
  );

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    if (!isValid()) { toast.error('Preencha todos os campos obrigatórios'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/briefing/public/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erro ao enviar');
      setStep(total); // success screen
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar briefing');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Auto-advance for single-selection types
  // ---------------------------------------------------------------------------

  function selectAndAdvance(key: string, value: string) {
    const updatedAnswers = { ...answers, [key]: value };
    setAnswers(updatedAnswers);
    setTimeout(() => {
      if (step === total - 1) {
        // Submete com as respostas atualizadas — evita stale closure
        setIsSubmitting(true);
        fetch(`/api/briefing/public/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: updatedAnswers }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (!data.success) throw new Error(data.message || 'Erro ao enviar');
            setStep(total);
          })
          .catch((err) => toast.error(err.message || 'Erro ao enviar briefing'))
          .finally(() => setIsSubmitting(false));
      } else {
        setStep((s) => s + 1);
      }
    }, 300);
  }

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold">Formulário não encontrado</h1>
          <p className="text-muted-foreground">Este link de briefing não existe ou foi desativado.</p>
        </div>
      </div>
    );
  }

  // Welcome screen
  if (step === -1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in duration-500">
          {config.logo_url && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.logo_url} alt={config.company_name} className="h-12 object-contain" />
            </div>
          )}
          <h1 className="text-2xl md:text-4xl font-bold leading-tight">{config.welcome_title}</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{config.welcome_message}</p>
          <Button
            size="lg"
            onClick={() => setStep(0)}
            className="text-base px-8 py-6"
            style={{ backgroundColor: config.primary_color }}
          >
            Começar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Success screen
  if (step === total) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-center">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold">Tudo certo!</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{config.success_message}</p>
        </div>
      </div>
    );
  }

  // Question screen
  const q = current!;
  const label = interpolate(q.label, answers);

  return (
    <div className="min-h-screen bg-background" onKeyDown={handleKeyDown}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: config.primary_color }}
        />
      </div>

      {/* Logo */}
      {config.logo_url && (
        <div className="fixed top-4 left-6 z-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={config.logo_url} alt={config.company_name} className="h-8 object-contain" />
        </div>
      )}

      <div className="flex items-center justify-center min-h-screen p-4 pt-20">
        <div className="max-w-2xl w-full animate-in fade-in duration-300">
          {/* Counter + voltar */}
          <div className="flex items-center gap-3 mb-4">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Voltar"
              >
                ← Voltar
              </button>
            )}
            <p className="text-sm text-muted-foreground">
              {step + 1} → {total}
            </p>
          </div>

          <div className="space-y-6">
            {/* Label */}
            <h2 className="text-3xl md:text-4xl font-medium">{label}</h2>
            {!q.is_required && (
              <p className="text-muted-foreground -mt-2 text-sm">Opcional — pressione OK para pular</p>
            )}

            {/* ---- text ---- */}
            {q.question_type === 'text' && (
              <>
                <Input
                  value={String(currentValue ?? '')}
                  onChange={(e) => updateAnswer(q.field_key, e.target.value)}
                  placeholder={q.placeholder ?? 'Digite aqui...'}
                  className="text-xl h-14 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                  autoFocus
                />
                <Button size="lg" onClick={advance} disabled={q.is_required && !currentValue}>
                  OK <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}

            {/* ---- textarea ---- */}
            {q.question_type === 'textarea' && (
              <>
                <Textarea
                  value={String(currentValue ?? '')}
                  onChange={(e) => updateAnswer(q.field_key, e.target.value)}
                  placeholder={q.placeholder ?? 'Digite aqui...'}
                  className="text-lg min-h-[120px] bg-transparent border border-border focus-visible:ring-0 focus-visible:border-primary resize-none"
                  autoFocus
                />
                <Button size="lg" onClick={advance} disabled={q.is_required && !currentValue}>
                  OK <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}

            {/* ---- url ---- */}
            {q.question_type === 'url' && (
              <>
                <Input
                  type="url"
                  value={String(currentValue ?? '')}
                  onChange={(e) => updateAnswer(q.field_key, e.target.value)}
                  placeholder={q.placeholder ?? 'https://...'}
                  className="text-xl h-14 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                  autoFocus
                />
                <Button size="lg" onClick={advance}>
                  OK <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}

            {/* ---- currency ---- */}
            {q.question_type === 'currency' && (
              <>
                <Input
                  value={String(currentValue ?? '')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const formatted = raw
                      ? `R$ ${(Number(raw) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '';
                    updateAnswer(q.field_key, formatted);
                  }}
                  placeholder="R$ 0,00"
                  className="text-xl h-14 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                  autoFocus
                />
                <Button size="lg" onClick={advance} disabled={q.is_required && !currentValue}>
                  OK <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}

            {/* ---- whatsapp ---- */}
            {q.question_type === 'whatsapp' && (
              <>
                <div className="flex gap-4">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-32 h-14 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+55">🇧🇷 +55</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+351">🇵🇹 +351</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={String(currentValue ?? '')}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      const formatted =
                        cleaned.length <= 10
                          ? cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
                          : cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                      updateAnswer(q.field_key, formatted);
                      updateAnswer('whatsapp_country_code', countryCode);
                    }}
                    placeholder="(11) 99999-9999"
                    className="text-xl h-14 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                    autoFocus
                  />
                </div>
                <Button
                  size="lg"
                  onClick={advance}
                  disabled={!currentValue || String(currentValue).length < 10}
                >
                  OK <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}

            {/* ---- select (botões com auto-avanço) ---- */}
            {q.question_type === 'select' && (
              <div className="space-y-3">
                {q.options?.map((opt, idx) => (
                  <button
                    key={opt.value}
                    onClick={() => selectAndAdvance(q.field_key, opt.value)}
                    className="w-full text-left p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all flex items-center gap-4 group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center font-semibold">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-lg">{opt.label || opt.value}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ---- radio (auto-advance) ---- */}
            {q.question_type === 'radio' && (
              <div className="space-y-3">
                {q.options?.map((opt, idx) => (
                  <button
                    key={opt.value}
                    onClick={() => selectAndAdvance(q.field_key, opt.value)}
                    className="w-full text-left p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all flex items-center gap-4 group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center font-semibold">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-lg">{opt.label || opt.value}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ---- multiselect ---- */}
            {q.question_type === 'multiselect' && (
              <>
                <div className="space-y-3">
                  {q.options?.map((opt) => {
                    const selected = (answers[q.field_key] as string[] | undefined) ?? [];
                    const active = selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          const next = active
                            ? selected.filter((v) => v !== opt.value)
                            : [...selected, opt.value];
                          updateAnswer(q.field_key, next);
                        }}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                          active ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            active ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}
                        >
                          {active && <span className="text-primary-foreground text-xs">✓</span>}
                        </div>
                        <span className="text-lg">{opt.label || opt.value}</span>
                      </button>
                    );
                  })}
                </div>
                <Button size="lg" onClick={advance} disabled={q.is_required && !((answers[q.field_key] as string[] | undefined)?.length)}>
                  OK <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}

            {/* ---- checkbox (single boolean) ---- */}
            {q.question_type === 'checkbox' && (
              <>
                <button
                  onClick={() => updateAnswer(q.field_key, !currentValue)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                    currentValue ? 'border-primary bg-accent' : 'border-border hover:border-primary'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      currentValue ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}
                  >
                    {!!currentValue && <span className="text-primary-foreground text-xs">✓</span>}
                  </div>
                  <span className="text-lg">{q.placeholder ?? 'Confirmar'}</span>
                </button>
                <Button size="lg" onClick={advance}>
                  OK <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
