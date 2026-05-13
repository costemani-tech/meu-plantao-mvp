import { supabase } from './supabase';

export const handleDirectCheckout = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const response = await fetch('/api/mercadopago/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, userEmail: user.email }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Erro ao gerar link de pagamento');
  
  if (data.init_point) {
    return data.init_point;
  } else {
    throw new Error('URL de pagamento não retornada pela API.');
  }
};
