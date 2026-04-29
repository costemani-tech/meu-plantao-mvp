'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, LocalTrabalho, isUserPro } from '../../lib/supabase';
import { gerarProximosPlantoes, SlotPlantao } from '../../lib/scale-generator';
import { useRouter } from 'next/navigation';
import EmptyState from '../../components/EmptyState';
import { ClipboardList, Bell, Trash2, AlertTriangle, X, ChevronRight, Calendar, Clock, Edit2, Plus, Star } from 'lucide-react';
import { formatDaysArray, formatBRTTime, formatRelativeShiftDate } from '../../lib/date-utils';

const CORES_PRESET = [
  '#4f8ef7', '#7c6af7', '#22d3b5', '#f97316',
  '#ef4444', '#22c55e', '#f59e0b', '#ec4899',
];

const REGRAS_PADRAO = [
  { value: '12x36', label: '12x36 (Trabalha 12h, folga 36h)' },
  { value: '24x48', label: '24x48 (Trabalha 24h, folga 48h)' },
  { value: '24x72', label: '24x72 (Trabalha 24h, folga 72h)' },
  { value: 'Outro', label: 'Outro (Personalizado)' },
] as const;
type Regra = string;

interface Toast { msg: string; type: 'success' | 'error' }
interface ResultadoAPI {
  success: boolean;
  escala_id?: string;
  total_plantoes?: number;
  periodo_ate?: string;
  error?: string;
  com_conflito?: boolean;
}
interface ConflitoDados {
  conflito: true;
  total_conflitos: number;
  exemplos: Array<{ inicio: string; fim: string }>;
  message: string;
}
interface EscalaAtiva {
  id: string;
  regra: string;
  tipo_jornada?: string;
  modo_jornada?: string;
  data_inicio: string;
  local_id?: string;
  local?: { nome: string; cor_calendario: string };
  plantoes?: { data_hora_inicio: string; data_hora_fim: string }[];
}



export default function EscalasPage() {
  const router = useRouter();
  const [locais, setLocais] = useState<LocalTrabalho[]>([]);
  const [localId, setLocalId] = useState('');
  const [dataInicioSo, setDataInicioSo] = useState('');
  const [horaInicio, setHoraInicio] = useState('07:00'); // valor padrão comum para plantões
  const [regra, setRegra] = useState<Regra>('12x36');
  const [tipoJornada, setTipoJornada] = useState<'Plantonista' | 'Diarista'>('Plantonista');
  const [tipoDiarista, setTipoDiarista] = useState<'semana' | 'corridos'>('semana');
  const [regraDiarista, setRegraDiarista] = useState('5x2');
  const [diasDiarista, setDiasDiarista] = useState<{ [key: string]: boolean }>({ d0: false, d1: true, d2: true, d3: true, d4: true, d5: true, d6: false });
  const anoAtualLocal = new Date().getFullYear();
  const [dataTerminoSo, setDataTerminoSo] = useState(`${anoAtualLocal}-12-31`);
  const [diasTrabalhoOutro, setDiasTrabalhoOutro] = useState('');
  const [diasDescansoOutro, setDiasDescansoOutro] = useState('');
  const [horaFim, setHoraFim] = useState('18:00');
  const [isCustomRule, setIsCustomRule] = useState(false);
  const [horasTrabalhoOutro, setHorasTrabalhoOutro] = useState('');
  const [horasDescansoOutro, setHorasDescansoOutro] = useState('');

  const [receberAlerta, setReceberAlerta] = useState(false);
  const [tempoAlerta, setTempoAlerta] = useState('2');

  const [isCreatingLocal, setIsCreatingLocal] = useState(false);
  const [novoLocalNome, setNovoLocalNome] = useState('');
  const [novoLocalIsHomeCare, setNovoLocalIsHomeCare] = useState(false);
  const [novoLocalCor, setNovoLocalCor] = useState(CORES_PRESET[0]);
  const [novoLocalEndereco, setNovoLocalEndereco] = useState('');
  const [savingLocal, setSavingLocal] = useState(false);

  const [preview, setPreview] = useState<SlotPlantao[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoAPI | null>(null);

  // Estados de gestão de escalas
  const [escalasAtivas, setEscalasAtivas] = useState<EscalaAtiva[]>([]);
  const [isLoadingEscalas, setIsLoadingEscalas] = useState(true);
  const [menuEscalaId, setMenuEscalaId] = useState<string | null>(null);
  const [modalEncerrar, setModalEncerrar] = useState<{ id: string; nome: string } | null>(null);
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [deletando, setDeletando] = useState(false);
  const [modalAlertas, setModalAlertas] = useState<EscalaAtiva | null>(null);
  const [alertasAtivo, setAlertasAtivo] = useState(false);
  const [alertasHoras, setAlertasHoras] = useState('2');
  const [enviandoAlertas, setEnviandoAlertas] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showProModal, setShowProModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPro = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsPro(false); return; }
      const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
      setIsPro(isUserPro(user.email) || (profile?.is_pro === true));
    };
    checkPro();
  }, []);

  const regraFinal = regra === 'Outro' ? `${horasTrabalhoOutro}x${horasDescansoOutro}` : regra;

  // Computa a data ISO completa baseada na separação de data e hora
  const dataCompletaISO = (dataInicioSo && horaInicio) ? `${dataInicioSo}T${horaInicio}:00` : '';

  const fetchLocais = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('locais_trabalho').select('*').eq('usuario_id', user.id).eq('ativo', true).order('nome');
    setLocais((data as LocalTrabalho[]) ?? []);
  }, []);

  const fetchEscalas = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoadingEscalas(false); return; }
    try {
      const { data, error } = await supabase
        .from('escalas')
        .select('id, regra, tipo_jornada, modo_jornada, data_inicio, local_id, local:locais_trabalho(nome, cor_calendario)')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });
      if (error) console.error('fetchEscalas error:', error);

      // Agrupar: manter apenas a escala mais recente por local_id
      const todas = (data as unknown as (EscalaAtiva & { local_id: string })[]) ?? [];
      const vistas = new Set<string>();
      const agrupadas = todas.filter(e => {
        if (!e.local_id || vistas.has(e.local_id)) return false;
        vistas.add(e.local_id);
        return true;
      });

      // Para cada escala, buscar o PRÓXIMO plantão futuro
      const now = new Date().toISOString();
      const escalasComPlantoes = await Promise.all(
        agrupadas.map(async (e) => {
          const { data: plantoes } = await supabase
            .from('plantoes')
            .select('data_hora_inicio, data_hora_fim')
            .eq('escala_id', e.id)
            .gte('data_hora_inicio', now)
            .order('data_hora_inicio', { ascending: true })
            .limit(1);
          return { ...e, plantoes: plantoes ?? [] };
        })
      );

      setEscalasAtivas(escalasComPlantoes);
    } finally {
      setIsLoadingEscalas(false);
    }
  }, []);

  useEffect(() => { fetchLocais(); fetchEscalas(); }, [fetchLocais, fetchEscalas]);

  useEffect(() => {
    const handler = () => fetchEscalas();
    window.addEventListener('plantoes-atualizados', handler);
    return () => window.removeEventListener('plantoes-atualizados', handler);
  }, [fetchEscalas]);


  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Preview das 5 primeiras datas em tempo real (permanece no frontend)
  useEffect(() => {
    if (dataCompletaISO && regraFinal) {
      const hr = parseInt(horasTrabalhoOutro, 10);
      const hd = parseInt(horasDescansoOutro, 10);
      if (regra === 'Outro' && (isNaN(hr) || isNaN(hd) || hr <= 0 || hd < 0)) {
        setPreview([]);
        return;
      }
      if (tipoJornada === 'Diarista') {
          const regCorr = regraDiarista === 'Outro'
            ? (diasTrabalhoOutro && diasDescansoOutro ? `${diasTrabalhoOutro}x${diasDescansoOutro}` : '')
            : regraDiarista;
          if (!regCorr) { setPreview([]); return; }
          setPreview(gerarProximosPlantoes(new Date(dataCompletaISO), regCorr, 'Diarista-Corridos', horaFim, 5));
      } else {
        setPreview(gerarProximosPlantoes(new Date(dataCompletaISO), regraFinal, tipoJornada, horaFim, 5));
      }
    } else {
      setPreview([]);
    }
  }, [dataCompletaISO, regraFinal, regra, horasTrabalhoOutro, horasDescansoOutro, tipoJornada, tipoDiarista, diasDiarista, regraDiarista, diasTrabalhoOutro, diasDescansoOutro, horaFim]);

  const salvarNovoLocal = async () => {
    if (!novoLocalNome.trim()) { showToast('Informe o nome do local.', 'error'); return; }
    
    if (isPro === null) {
      showToast('Aguarde, verificando seu plano...', 'error');
      return;
    }

    setSavingLocal(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { showToast('Usuário não autenticado.', 'error'); setSavingLocal(false); return; }

      if (!isPro) {
        const { count } = await supabase
          .from('locais_trabalho')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', user.id)
          .eq('ativo', true);
        if (count !== null && count >= 2) {
          setShowProModal(true);
          setSavingLocal(false);
          return;
        }
      }

      const { data, error } = await supabase.from('locais_trabalho').insert({
        usuario_id: user.id,
        nome: novoLocalNome.trim(),
        cor_calendario: novoLocalCor,
        endereco: novoLocalIsHomeCare ? null : novoLocalEndereco.trim(),
        is_home_care: novoLocalIsHomeCare
      }).select().single();

      if (error) {
        console.error('[salvarNovoLocal] Supabase error:', error);
        showToast('Erro ao criar local: ' + error.message, 'error');
      } else if (data) {
        setLocais(prev => [...prev, data as LocalTrabalho].sort((a, b) => a.nome.localeCompare(b.nome)));
        setLocalId(data.id);
        setIsCreatingLocal(false);
        setNovoLocalNome('');
        setNovoLocalIsHomeCare(false);
        setNovoLocalCor(CORES_PRESET[0]);
        setNovoLocalEndereco('');
        showToast('Local criado e selecionado! Agora clique em Criar Escala.', 'success');
      }
    } catch (err: any) {
      console.error('[salvarNovoLocal] Unexpected error:', err);
      showToast('Erro inesperado: ' + (err?.message || 'Tente novamente.'), 'error');
    } finally {
      setSavingLocal(false);
    }
  };

  const handleEditar = async (e: any) => {
    try {
      setEditingId(e.id);
      setLocalId(e.local_id || '');
      
      // Buscar horários do primeiro plantão para preencher o formulário
      const { data: primeiro } = await supabase
        .from('plantoes')
        .select('data_hora_inicio, data_hora_fim')
        .eq('escala_id', e.id)
        .order('data_hora_inicio', { ascending: true })
        .limit(1)
        .single();

      if (primeiro) {
        const dIn = new Date(primeiro.data_hora_inicio);
        const dFi = new Date(primeiro.data_hora_fim);
        const pad = (n: number) => n.toString().padStart(2, '0');
        setHoraInicio(`${pad(dIn.getHours())}:${pad(dIn.getMinutes())}`);
        setHoraFim(`${pad(dFi.getHours())}:${pad(dFi.getMinutes())}`);
      }

      const tipo = e.tipo_jornada === 'Diarista' ? 'Diarista' : 'Plantonista';
      setTipoJornada(tipo);
      
      if (tipo === 'Diarista' && e.modo_jornada) {
        setTipoDiarista(e.modo_jornada as 'semana' | 'corridos');
        if (e.modo_jornada === 'semana') {
          const dias = (e.regra || '').split(',');
          const novosDias = { d0: false, d1: false, d2: false, d3: false, d4: false, d5: false, d6: false };
          dias.forEach((d: string) => {
            if (d) (novosDias as any)[`d${d.trim()}`] = true;
          });
          setDiasDiarista(novosDias);
        } else {
          if (e.regra && e.regra.includes('x')) {
            setRegraDiarista('Outro');
            const [trabalho, descanso] = e.regra.split('x');
            setDiasTrabalhoOutro(trabalho);
            setDiasDescansoOutro(descanso);
          } else {
            setRegraDiarista(e.regra);
          }
        }
      } else {
        if (e.regra && e.regra.includes('x')) {
          setRegra('Outro');
          setIsCustomRule(true);
          const [trabalho, descanso] = e.regra.split('x');
          setHorasTrabalhoOutro(trabalho);
          setHorasDescansoOutro(descanso);
        } else {
          setRegra(e.regra || '12x36');
          setIsCustomRule(false);
        }
      }
      
      if (e.data_inicio) {
        setDataInicioSo(e.data_inicio);
      }
      
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Erro ao preparar edição:', err);
    }
  };

  const salvarEscala = async () => {
    // Guard: user has new-local panel open but hasn't saved the local yet
    if (isCreatingLocal) {
      showToast('Salve o novo local antes de criar a escala.', 'error');
      return;
    }
    if (!localId) {
      showToast('Selecione ou crie um local de trabalho.', 'error');
      return;
    }
    if (!dataInicioSo) {
      showToast('Informe a data de início dos plantões.', 'error');
      return;
    }
    if (!horaInicio) {
      showToast('Informe o horário de entrada.', 'error');
      return;
    }

    setSaving(true);
    setUltimoResultado(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado. Faça login novamente.');

      // Se for edição, limpar plantões futuros da escala anterior
      if (editingId) {
        const now = new Date().toISOString();
        await supabase
          .from('plantoes')
          .delete()
          .eq('escala_id', editingId)
          .gte('data_hora_inicio', now);
      }

      const parts = regraFinal.split('x');
      const trabalho = parseInt(parts[0], 10) || 12;
      const descanso = parseInt(parts[1], 10) || 36;
      const ciclo = trabalho + descanso;

      const anoAtual = new Date().getFullYear();
      const dataFinal = new Date(anoAtual, 11, 31, 23, 59, 59);
      // Determina regra correta para cada tipo de jornada
      let regraParaSalvar = regraFinal;
      let modoJornada: string | null = null;
      if (tipoJornada === 'Diarista') {
        if (tipoDiarista === 'corridos') {
          regraParaSalvar = regraDiarista === 'Outro' ? `${diasTrabalhoOutro}x${diasDescansoOutro}` : regraDiarista;
          modoJornada = 'corridos';
        } else {
          const diasSel = Object.entries(diasDiarista).filter(([, v]) => v).map(([d]) => d.replace('d', '')).join(',');
          regraParaSalvar = diasSel || '1,2,3,4,5';
          modoJornada = 'semana';
        }
      }

      let escalaCriada;
      
      if (editingId) {
        const { data: updated, error: erroUpdate } = await supabase
          .from('escalas')
          .update({
            local_id: localId,
            data_inicio: dataInicioSo,
            regra: regraParaSalvar,
            tipo_jornada: tipoJornada,
            modo_jornada: modoJornada
          })
          .eq('id', editingId)
          .select()
          .single();
          
        if (erroUpdate) throw erroUpdate;
        escalaCriada = updated;
      } else {
        const { data: inserted, error: erroEscala } = await supabase
          .from('escalas')
          .insert({
            usuario_id: user.id,
            local_id: localId,
            data_inicio: dataInicioSo,
            regra: regraParaSalvar,
            tipo_jornada: tipoJornada,
            modo_jornada: modoJornada
          })
          .select()
          .single();

        if (erroEscala) throw erroEscala;
        escalaCriada = inserted;
      }

      const arrayDePlantoes = [];
      const dataTerminoSegura = dataTerminoSo || `${anoAtual}-12-31`;
      const dataFinalObj = new Date(`${dataTerminoSegura}T23:59:59`);
      const dataAtualObj = new Date(`${dataInicioSo}T${horaInicio}:00`);

      if (tipoJornada === 'Plantonista') {
        while (dataAtualObj <= dataFinalObj) {
          const inicioIso = dataAtualObj.toISOString();
          const fimObj = new Date(dataAtualObj);
          fimObj.setHours(fimObj.getHours() + trabalho);

          if (dataAtualObj <= dataFinalObj) {
            arrayDePlantoes.push({
              escala_id: escalaCriada.id,
              usuario_id: user.id,
              local_id: localId,
              data_hora_inicio: inicioIso,
              data_hora_fim: fimObj.toISOString(),
              status: 'Agendado',
              is_extra: false
            });
          }

          dataAtualObj.setHours(dataAtualObj.getHours() + ciclo);
        }
      } else if (tipoJornada === 'Diarista' && tipoDiarista === 'corridos') {
        const [hFim, mFim] = horaFim.split(':').map(Number);
        const regCorr = regraDiarista === 'Outro'
          ? `${diasTrabalhoOutro}x${diasDescansoOutro}`
          : regraDiarista;
        const parts2 = regCorr.split('x');
        const dTrabalho2 = parseInt(parts2[0], 10) || 5;
        const dDescanso2 = parseInt(parts2[1], 10) || 2;
        const cicloDias2 = dTrabalho2 + dDescanso2;
        let idx2 = 0;
        while (dataAtualObj <= dataFinalObj) {
          if (idx2 < dTrabalho2) {
            const inicioIso = dataAtualObj.toISOString();
            const fimObj = new Date(dataAtualObj);
            fimObj.setHours(hFim, mFim, 0, 0);
            if (fimObj <= dataAtualObj) fimObj.setDate(fimObj.getDate() + 1);
            arrayDePlantoes.push({ escala_id: escalaCriada.id, usuario_id: user.id, local_id: localId, data_hora_inicio: inicioIso, data_hora_fim: fimObj.toISOString(), status: 'Agendado', is_extra: false });
          }
          dataAtualObj.setDate(dataAtualObj.getDate() + 1);
          idx2 = (idx2 + 1) % cicloDias2;
        }
      } else {
        const [hFim, mFim] = horaFim.split(':').map(Number);
        const diasSelecionadosStr = Object.entries(diasDiarista).filter(([, v]) => v).map(([d]) => d.replace('d', '')).join(',');
        const diasPermitidos = diasSelecionadosStr.split(',').map(Number);
        
        while (dataAtualObj <= dataFinalObj) {
          if (diasPermitidos.includes(dataAtualObj.getDay())) {
            const inicioIso = dataAtualObj.toISOString();
            const fimObj = new Date(dataAtualObj);
            fimObj.setHours(hFim, mFim, 0, 0);
            if (fimObj <= dataAtualObj) fimObj.setDate(fimObj.getDate() + 1);

            arrayDePlantoes.push({
              escala_id: escalaCriada.id,
              usuario_id: user.id,
              local_id: localId,
              data_hora_inicio: inicioIso,
              data_hora_fim: fimObj.toISOString(),
              status: 'Agendado',
              is_extra: false
            });
          }
          dataAtualObj.setDate(dataAtualObj.getDate() + 1);
        }
      }

      if (arrayDePlantoes.length > 0) {
        const { error: erroInsert } = await supabase.from('plantoes').insert(arrayDePlantoes);
        if (erroInsert) {
          await supabase.from('escalas').delete().eq('id', escalaCriada.id);
          throw erroInsert;
        }

        if (receberAlerta) {
          const localSelecionado = locais.find(l => l.id === localId);
          const nomeLocal = localSelecionado?.nome || 'seu local de trabalho';

          const pushNotifications: any[] = [];
          const dbNotificacoes: any[] = [];
          const antecedencia = parseInt(tempoAlerta, 10);

          arrayDePlantoes.forEach((plantao) => {
            const startDate = new Date(plantao.data_hora_inicio);
            const sendAfter = new Date(startDate.getTime() - antecedencia * 60 * 60 * 1000);
            
            if (sendAfter > new Date()) {
              const horaStr = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              
              pushNotifications.push({
                app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "SUA_CHAVE_ONESIGNAL",
                include_aliases: { external_id: [user.id] },
                target_channel: 'push',
                collapse_id: `shift_${escalaCriada.id}_${plantao.data_hora_inicio}`,
                headings: { "en": `🩺 Plantão hoje às ${horaStr}`, "pt": `🩺 Plantão hoje às ${horaStr}` },
                contents: { 
                  "en": `${nomeLocal}\nPrepare-se com antecedência. Bom plantão!`,
                  "pt": `${nomeLocal}\nPrepare-se com antecedência. Bom plantão!`
                },
                send_after: sendAfter.toISOString()
              });

              dbNotificacoes.push({
                usuario_id: user.id,
                escala_id: escalaCriada.id,
                data_hora_inicio: plantao.data_hora_inicio,
                publicar_em: sendAfter.toISOString(),
                titulo: `🏥 Plantão em ${antecedencia}h — ${nomeLocal}`,
                mensagem: `Você tem plantão em ${nomeLocal} às ${horaStr}. Bom trabalho!`,
                lida: false
              });
            }
          });
          
          if (dbNotificacoes.length > 0) {
            try {
              await supabase.from('notificacoes').upsert(dbNotificacoes, { 
                onConflict: 'usuario_id,escala_id,data_hora_inicio' 
              });
            } catch { /* silently ignore notification errors */ }
          }
        }
      }

      showToast(editingId ? 'Escala atualizada com sucesso!' : 'Escala gerada com sucesso!', 'success');
      window.dispatchEvent(new CustomEvent('plantoes-atualizados'));
      
      if (!editingId) {
        setLocalId('');
        setDataInicioSo('');
        setRegra('12x36');
      }

      setEditingId(null);
      
      setTimeout(() => {
        router.push('/calendario');
      }, 1500);

    } catch (err: any) {
      console.error('[salvarEscala] Error:', err);
      showToast('Erro ao salvar: ' + (err?.message || 'Falha ao processar escala.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const excluirEscala = async (id: string, modo: 'completo' | 'encerrar_em', dataCorte?: string) => {
    setDeletando(true);
    try {
      const response = await fetch(`/api/escalas/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo, ...(dataCorte && { data_encerramento: new Date(dataCorte).toISOString() }) }),
      });
      const resultado = await response.json();
      if (!response.ok) {
        showToast(' ' + (resultado.error ?? 'Erro ao excluir escala.'), 'error');
      } else {
        const msg = modo === 'completo'
          ? ' Escala excluída completamente!'
          : ` Escala encerrada em ${new Date(dataCorte!).toLocaleDateString('pt-BR')}. ${resultado.plantoes_removidos} plantões futuros removidos.`;
        showToast(msg, 'success');
        setModalEncerrar(null);
        setDataEncerramento('');
        fetchEscalas();
        window.dispatchEvent(new CustomEvent('plantoes-atualizados'));
      }
    } catch {
      showToast(' Erro de conexão.', 'error');
    }
    setDeletando(false);
    setMenuEscalaId(null);
  };

  return (
    <div className="page-container">
      {/* ===== TOAST GLOBAL ===== */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999999, padding: '14px 24px', borderRadius: 16, maxWidth: '90vw',
          background: toast.type === 'success' ? '#16a34a' : '#dc2626',
          color: '#fff', fontWeight: 700, fontSize: 14, textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease'
        }}>
          {toast.type === 'error' ? '❌ ' : '✅ '}{toast.msg}
        </div>
      )}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Escalas <ClipboardList size={24} style={{ marginLeft: 8, display: "inline" }} /></h1>
          <p>Organize seus plantões de forma simples</p>
        </div>
        {!showForm && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
            style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ fontSize: 16 }}>+</span> Criar Escala
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ marginBottom: 32, animation: 'fadeIn 0.3s ease' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowForm(false)}
            style={{ marginBottom: 16, border: 'none', background: 'transparent', padding: 0, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            ← Voltar para lista
          </button>

      <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {/* Formulário */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>{editingId ? 'Editar Escala' : 'Nova Escala'}</h2>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Local de Trabalho</label></div>

            {isCreatingLocal ? (
              <div style={{ padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', marginBottom: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome do novo local"
                  value={novoLocalNome}
                  onChange={e => setNovoLocalNome(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    id="homecareCheckbox"
                    checked={novoLocalIsHomeCare}
                    onChange={e => setNovoLocalIsHomeCare(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent-teal)' }}
                  />
                  <label htmlFor="homecareCheckbox" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    É atendimento <strong>Home Care</strong> 
                  </label>
                </div>

                {!novoLocalIsHomeCare && (
                  <div style={{ marginBottom: 12 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Endereço (Opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                      value={novoLocalEndereco}
                      onChange={e => setNovoLocalEndereco(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Cor no Calendário</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {CORES_PRESET.map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNovoLocalCor(c)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: c,
                          border: novoLocalCor === c ? '2px solid white' : '2px solid transparent',
                          boxShadow: novoLocalCor === c ? '0 0 0 1px var(--text-primary)' : 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Escolher Cor"
                      />
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={salvarNovoLocal}
                  disabled={savingLocal}
                  style={{ width: '100%', padding: '6px 12px', fontSize: 13 }}
                >
                  {savingLocal ? ' Salvando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            ) : (
              <>
                <select className="form-select" value={localId} onChange={e => setLocalId(e.target.value)}>
                  <option value="">Selecione um local...</option>
                  {locais.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
                <button type="button" onClick={() => setIsCreatingLocal(true)} style={{ background: "none", border: "none", color: "var(--accent-blue)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 0 0 0", display: "flex", alignItems: "center", gap: 4 }}><Plus size={14} /> Novo local</button>
                {locais.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Ainda não há locais. Clique em &quot;Criar Novo&quot; acima.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Tipo de Jornada</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className={`btn ${tipoJornada === 'Plantonista' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ flex: 1 }} 
                onClick={() => setTipoJornada('Plantonista')}
              >
                Plantonista
              </button>
              <button 
                className={`btn ${tipoJornada === 'Diarista' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ flex: 1 }} 
                onClick={() => setTipoJornada('Diarista')}
              >
                Diarista
              </button>
            </div>
          </div>

          {tipoJornada === 'Plantonista' ? (
          <div className="form-group">
            <label className="form-label">Regra de Escala</label>
            <select
              className="form-select"
              value={regra}
              onChange={e => {
                const v = e.target.value;
                setRegra(v);
                setIsCustomRule(v === 'Outro');
                if (v !== 'Outro') { setHorasTrabalhoOutro(''); setHorasDescansoOutro(''); }
              }}
            >
              {REGRAS_PADRAO.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>


            {isCustomRule && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginTop: 12,
                  padding: 16,
                  background: 'var(--bg-secondary)',
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  animation: 'fadeInDown 0.2s ease',
                }}
              >
                <div>
                  <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Horas Trabalhadas</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={horasTrabalhoOutro}
                    onChange={e => setHorasTrabalhoOutro(e.target.value)}
                    placeholder="Ex: 12"
                    style={{ marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Horas de Descanso</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={horasDescansoOutro}
                    onChange={e => setHorasDescansoOutro(e.target.value)}
                    placeholder="Ex: 60"
                    style={{ marginTop: 4, background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <p style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  Ciclo total: {(parseInt(horasTrabalhoOutro,10)||0) + (parseInt(horasDescansoOutro,10)||0)}h &nbsp;·&nbsp; Formato gerado: <strong style={{ color: 'var(--text-secondary)' }}>{horasTrabalhoOutro||'?'}x{horasDescansoOutro||'?'}</strong>
                </p>
              </div>
            )}
          </div>
          ) : (
          <div className="form-group">
            <label className="form-label">Modo de Jornada</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                style={{ flex: 1, padding: '8px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: tipoDiarista === 'semana' ? 'none' : '1px solid var(--border-subtle)', background: tipoDiarista === 'semana' ? 'var(--accent-blue)' : 'var(--bg-secondary)', color: tipoDiarista === 'semana' ? '#fff' : 'var(--text-primary)', cursor: 'pointer' }}
                onClick={() => setTipoDiarista('semana')}
              >Dias da Semana</button>
              <button
                type="button"
                style={{ flex: 1, padding: '8px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: tipoDiarista === 'corridos' ? 'none' : '1px solid var(--border-subtle)', background: tipoDiarista === 'corridos' ? 'var(--accent-blue)' : 'var(--bg-secondary)', color: tipoDiarista === 'corridos' ? '#fff' : 'var(--text-primary)', cursor: 'pointer' }}
                onClick={() => setTipoDiarista('corridos')}
              >Dias Corridos</button>
            </div>

            {tipoDiarista === 'semana' ? (
              <>
                <label className="form-label" style={{ fontSize: 12 }}>Dias Trabalhados</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {[
                    { id: 'd1', label: 'Seg' }, { id: 'd2', label: 'Ter' }, { id: 'd3', label: 'Qua' },
                    { id: 'd4', label: 'Qui' }, { id: 'd5', label: 'Sex' }, { id: 'd6', label: 'Sáb' }, { id: 'd0', label: 'Dom' }
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      style={{ flex: 1, padding: '8px 4px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: diasDiarista[d.id] ? 'none' : '1px solid var(--border-subtle)', background: diasDiarista[d.id] ? 'var(--accent-blue)' : 'var(--bg-secondary)', color: diasDiarista[d.id] ? '#fff' : 'var(--text-primary)', cursor: 'pointer' }}
                      onClick={() => setDiasDiarista(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
                    >{d.label}</button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Ex: hospital com dias fixos — marque apenas quais dias você trabalha.</p>
              </>
            ) : (
              <>
                <label className="form-label" style={{ fontSize: 12 }}>Ciclo em Dias Corridos</label>
                <select className="form-select" value={regraDiarista} onChange={e => setRegraDiarista(e.target.value)}>
                  <option value="5x2">Diarista (Segunda a Sexta)</option>
                  <option value="6x1">Diarista (6x1)</option>
                  <option value="Outro">Outro (Personalizado)</option>
                </select>
                {regraDiarista === 'Outro' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10, padding: 14, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dias Trabalhando</label>
                      <input type="number" min="1" className="form-input" value={diasTrabalhoOutro} onChange={e => setDiasTrabalhoOutro(e.target.value)} placeholder="Ex: 6" style={{ marginTop: 4 }} />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dias Folgando</label>
                      <input type="number" min="1" className="form-input" value={diasDescansoOutro} onChange={e => setDiasDescansoOutro(e.target.value)} placeholder="Ex: 1" style={{ marginTop: 4 }} />
                    </div>
                  </div>
                )}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Ex: shopping — trabalha 6 dias seguidos independente do dia da semana.</p>
              </>
            )}
          </div>
          )}


          <div className="form-group mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                Dia do 1º Plantão
              </label>
              <input
                type="date"
                className="form-input"
                style={{ cursor: 'pointer' }}
                value={dataInicioSo}
                onChange={e => setDataInicioSo(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                Horário de Início
              </label>
              <input
                type="time"
                className="form-input"
                style={{ cursor: 'pointer' }}
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: tipoJornada === 'Diarista' ? '1fr 1fr' : '1fr', gap: 12, marginTop: 8, alignItems: 'start' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ whiteSpace: 'nowrap' }}>Escala até</label>
              <input type="date" className="form-input" value={dataTerminoSo} onChange={e => setDataTerminoSo(e.target.value)} />
            </div>
            {tipoJornada === 'Diarista' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ whiteSpace: 'nowrap' }}>Saída</label>
                <input type="time" className="form-input" value={horaFim} onChange={e => setHoraFim(e.target.value)} />
              </div>
            )}
          </div>

          <div className="form-group" style={{ 
            marginTop: 16, 
            padding: 16, 
            background: 'var(--bg-secondary)', 
            borderRadius: 12, 
            border: '1px solid var(--border-subtle)' 
          }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} 
              onClick={async () => {
                const novoEstado = !receberAlerta;
                setReceberAlerta(novoEstado);
                
                // Gatilho de Permissão OneSignal
                if (novoEstado) {
                  const win = window as any;
                  if (win.OneSignalDeferred) {
                    win.OneSignalDeferred.push(async (OneSignal: any) => {
                      await OneSignal.Notifications.requestPermission();
                      const user = (await supabase.auth.getUser()).data.user;
                      if (user) await OneSignal.login(user.id);
                    });
                  }
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🔔</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Alertas no Celular</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Deseja receber avisos destes plantões?</div>
                </div>
              </div>
              <div style={{
                width: 44, height: 24, borderRadius: 12, background: receberAlerta ? 'var(--accent-teal)' : 'var(--border-subtle)',
                position: 'relative', transition: 'background 0.3s'
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: receberAlerta ? 22 : 2,
                  transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>

            {receberAlerta && (
              <div style={{ marginTop: 16, animation: 'fadeInDown 0.3s ease' }}>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>Avisar com qual antecedência?</label>
                <select 
                  className="form-select w-full" 
                  value={tempoAlerta} 
                  onChange={e => setTempoAlerta(e.target.value)}
                  style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', outline: 'none', transition: 'all 0.2s ease', cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                  <option value="1">1 Hora antes</option>
                  <option value="2">2 Horas antes</option>
                  <option value="4">4 Horas antes</option>
                  <option value="8">8 Horas antes</option>
                  <option value="12">12 Horas antes</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => salvarEscala()}
              disabled={saving || (isCustomRule && (!(parseInt(horasTrabalhoOutro,10) > 0) || !(parseInt(horasDescansoOutro,10) > 0)))}
            >
              {saving ? ' Criando...' : ' Criar Escala'}
            </button>
          </div>

          {ultimoResultado?.success && (
            <div style={{
              marginTop: 16,
              padding: '14px 16px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
            }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: 6 }}>
                 Escala criada com sucesso!
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <span> <strong>{ultimoResultado.total_plantoes}</strong> plantões gerados</span><br />
                <span>📅 Até <strong>{ultimoResultado.periodo_ate}</strong></span><br />
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          <div className="card" style={{ height: 'fit-content' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 4, fontSize: 16 }}>Preview das Próximas Datas</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              As 5 primeiras datas projetadas — calculadas em tempo real
            </p>

            {(dataInicioSo && regraFinal && preview.length > 0) ? (
              <div className="dates-preview">
                <div className="dates-preview-title">
                  📆 Próximas {preview.length} ocorrências — {tipoJornada === 'Diarista' ? 'Diarista' : regraFinal}
                </div>
                {preview.map((slot, i) => {
                  const duracaoMin = Math.round((slot.fim.getTime() - slot.inicio.getTime()) / 60000);
                  const duracaoLabel = tipoJornada === 'Diarista'
                    ? `${new Date(slot.inicio).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}–${horaFim}`
                    : `${duracaoMin / 60}h`;
                  return (
                  <div key={i} className="date-preview-item" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 6px', borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-muted)' }}>#{i + 1}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        {new Date(slot.inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {new Date(slot.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {duracaoLabel}
                    </div>
                  </div>
                );})}
              </div>
            ) : (
              <div style={{ padding: 32, textAlign: 'center', opacity: 0.6 }}>
                <p>Preencha os campos ao lado para ver o preview.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      )}

      {!showForm && (
        <div style={{ marginTop: 32 }}>
          {isLoadingEscalas ? (
            <div className="skeleton" style={{ height: 100, width: '100%', borderRadius: 12 }} />
          ) : escalasAtivas.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={48} />}
              title="Nenhuma escala cadastrada"
              description="Cadastre seu primeiro local e comece a organizar seus plantões."
              actionLabel="Adicionar escala"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <>
              <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--text-primary)' }}> Minhas Escalas Ativas</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {escalasAtivas.map(e => {
                  const p = e.plantoes?.[0];
                  let horaInicialFormatada = '--:--';
                  let proximoPlantaoStr = 'Sem plantões futuros';
                  
                  if (p) {
                    horaInicialFormatada = new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    proximoPlantaoStr = `Próximo: ${new Date(p.data_hora_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${horaInicialFormatada}`;
                  }
                  
                  return (
                    <div 
                      key={e.id} 
                      className="card" 
                      style={{ padding: '16px', cursor: 'pointer', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}
                      onClick={() => setMenuEscalaId(menuEscalaId === e.id ? null : e.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: e.local?.cor_calendario ?? '#4f8ef7' }} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{e.local?.nome ?? 'Local desconhecido'}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                              {formatDaysArray(e.regra)} • {e.plantoes && e.plantoes.length > 0 ? `Próximo: ${new Date(e.plantoes[0].data_hora_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${formatBRTTime(e.plantoes[0].data_hora_inicio)}` : 'Sem plantões futuros'}
                            </div>
                          </div>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <button 
                            onClick={(event) => {
                              event.stopPropagation();
                              setMenuEscalaId(menuEscalaId === e.id ? null : e.id);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '4px 8px', color: 'var(--text-muted)' }}
                          >
                            ⋮
                          </button>
                          
                          {menuEscalaId === e.id && (
                            <div style={{ 
                              position: 'absolute', right: 0, top: '100%', background: 'var(--bg-secondary)', 
                              border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: 'var(--shadow-lg)',
                              zIndex: 100, minWidth: 180, overflow: 'hidden', animation: 'fadeInDown 0.2s ease'
                            }}>
                              <button 
                                onClick={(event) => { event.stopPropagation(); handleEditar(e); setMenuEscalaId(null); }}
                                style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, textAlign: 'left', userSelect: 'none' }}
                                className="hover-bg"
                              >
                                <Edit2 size={16} /> Editar Plantões
                              </button>
                              <button 
                                onClick={(event) => { event.stopPropagation(); setModalAlertas(e); setMenuEscalaId(null); }}
                                style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, textAlign: 'left', userSelect: 'none' }}
                                className="hover-bg"
                              >
                                <Bell size={16} /> Configurar Alertas
                              </button>
                              <button 
                                onClick={(event) => { event.stopPropagation(); setModalEncerrar({ id: e.id, nome: e.local?.nome || 'Escala' }); setMenuEscalaId(null); }}
                                style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 13, textAlign: 'left', userSelect: 'none' }}
                                className="hover-bg"
                              >
                                <Trash2 size={16} /> Encerrar / Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
      {/* MODAL CONFIGURAR ALERTAS */}
      {modalAlertas && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', borderRadius: 24, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Alertas de Plantão</h3>
              <button onClick={() => setModalAlertas(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Receba notificações push no seu celular antes de cada plantão desta escala ({modalAlertas.local?.nome}).
            </p>

            <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 16, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
              <label className="form-label" style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>Antecedência do Alerta</label>
              <select 
                className="form-select" 
                value={alertasHoras} 
                onChange={e => setAlertasHoras(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="1">1 hora antes</option>
                <option value="2">2 horas antes</option>
                <option value="4">4 horas antes</option>
                <option value="8">8 horas antes</option>
                <option value="12">12 horas antes</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalAlertas(null)}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, background: 'var(--accent-blue)' }}
                onClick={async () => {
                   setEnviandoAlertas(true);
                   // Simulação de salvamento/ativação (no futuro integrar com API de notificações)
                   await new Promise(r => setTimeout(r, 800));
                   showToast('Configurações de alerta atualizadas!', 'success');
                   setModalAlertas(null);
                   setEnviandoAlertas(false);
                }}
                disabled={enviandoAlertas}
              >
                {enviandoAlertas ? 'Salvando...' : 'Ativar Alertas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ENCERRAR / EXCLUIR ESCALA */}
      {modalEncerrar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', borderRadius: 24, padding: 24, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <AlertTriangle size={32} color="#EF4444" />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Gerenciar Escala</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>{modalEncerrar.nome}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Encerrar Escala</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Define uma data de término e remove plantões após essa data.</p>
                <input 
                  type="date" 
                  className="form-input" 
                  value={dataEncerramento} 
                  onChange={e => setDataEncerramento(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                  onClick={() => {
                    if (!dataEncerramento) { showToast('Selecione uma data.', 'error'); return; }
                    excluirEscala(modalEncerrar.id, 'encerrar_em', dataEncerramento);
                  }}
                  disabled={deletando}
                >
                  Encerrar na Data Selecionada
                </button>
              </div>

              <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 16, border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#EF4444' }}>Exclusão Total</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Remove a escala e TODOS os plantões vinculados (passados e futuros).</p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', background: '#EF4444', fontSize: 12 }}
                  onClick={() => {
                    if (confirm('Tem certeza? Isso apagará TODO o histórico desta escala.')) {
                      excluirEscala(modalEncerrar.id, 'completo');
                    }
                  }}
                  disabled={deletando}
                >
                  Excluir Permanentemente
                </button>
              </div>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setModalEncerrar(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
