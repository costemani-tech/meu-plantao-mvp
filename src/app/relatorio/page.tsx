'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, isUserPro } from '../../lib/supabase';
import { ArrowLeft, Printer } from 'lucide-react';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function RelatorioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const mesParam = searchParams.get('mes');
  const anoParam = searchParams.get('ano');
  
  const [plantoesExtra, setPlantoesExtra] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      
      const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
      const userIsPro = (profile?.is_pro ?? false) || isUserPro(user.email);
      setIsPro(userIsPro);

      if (!userIsPro) {
        alert('Este recurso é exclusivo para assinantes PRO.');
        router.push('/');
        return;
      }

      if (!mesParam || !anoParam) {
        router.push('/');
        return;
      }

      const mesNum = parseInt(mesParam, 10);
      const anoNum = parseInt(anoParam, 10);

      const inicioMes = new Date(anoNum, mesNum - 1, 1).toISOString();
      const fimMes = new Date(anoNum, mesNum, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('plantoes')
        .select(`
          id, data_hora_inicio, data_hora_fim, notas, is_extra, status,
          local:locais_trabalho(nome)
        `)
        .eq('usuario_id', user.id)
        .eq('is_extra', true)
        .neq('status', 'Cancelado')
        .gte('data_hora_inicio', inicioMes)
        .lte('data_hora_inicio', fimMes)
        .order('data_hora_inicio', { ascending: true });

      if (data) {
        setPlantoesExtra(data);
        
        // Sum values matching R$ X.XX
        let sum = 0;
        data.forEach(p => {
          if (p.notas) {
            const match = p.notas.match(/R\$\s*([\d.]+)/);
            if (match && match[1]) {
              sum += parseFloat(match[1]);
            }
          }
        });
        setTotal(sum);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [mesParam, anoParam, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: 'var(--text-muted)' }}>
        Carregando relatório...
      </div>
    );
  }

  const mesNum = parseInt(mesParam || '1', 10);
  const anoNum = parseInt(anoParam || '2025', 10);
  const mesNome = MESES[mesNum - 1];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          :root {
            background: white;
          }
        }
      `}} />

      <div className="no-print" style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => router.push('/')} style={{ padding: '8px 16px' }}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ background: 'var(--accent-teal)', border: 'none', padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Printer size={18} /> Baixar PDF / Imprimir
        </button>
      </div>

      <div style={{ paddingBottom: 60, display: 'flex', justifyContent: 'center' }}>
        {/* Container A4 */}
        <div id="print-area" style={{ 
          width: '100%', maxWidth: '210mm', minHeight: '297mm', 
          background: '#ffffff', padding: '20mm', borderRadius: 8, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          color: '#334155'
        }}>
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 16, marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0f172a' }}>Resumo dos Ganhos 💰</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Meu Plantão Ganhos</p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Mês de Referência</h2>
            <p style={{ margin: 0, color: '#475569', fontSize: 18 }}>{mesNome} de {anoNum}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#475569', textTransform: 'uppercase' }}>Data</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#475569', textTransform: 'uppercase' }}>Local</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#475569', textTransform: 'uppercase' }}>Horário</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#475569', textTransform: 'uppercase' }}>Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {plantoesExtra.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    Nenhum plantão extra financeiro registrado neste mês.
                  </td>
                </tr>
              ) : (
                plantoesExtra.map(p => {
                  let valorStr = '-';
                  if (p.notas) {
                     const match = p.notas.match(/R\$\s*([\d.]+)/);
                     if (match && match[1]) {
                        valorStr = parseFloat(match[1]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                     } else if (p.notas.includes('Troca')) {
                        valorStr = 'Troca (Sem Valor)';
                     }
                  }

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#334155' }}>
                        {new Date(p.data_hora_inicio).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#334155', fontWeight: 600 }}>
                        {p.local?.nome ?? 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#334155' }}>
                        {new Date(p.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {new Date(p.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#334155', textAlign: 'right', fontWeight: valorStr.includes('R$') ? 700 : 400 }}>
                        {valorStr}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>Total Faturado no Mês</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            Documento gerado automaticamente pelo aplicativo Meu Plantão PRO.
          </div>
        </div>
      </div>
    </>
  );
}

export default function RelatorioPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--text-muted)' }}>Mapeando relatórios...</div>}>
      <RelatorioContent />
    </Suspense>
  );
}
