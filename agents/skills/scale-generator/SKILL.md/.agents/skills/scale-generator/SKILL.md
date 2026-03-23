 Lógica de Geração de Escalas (Scale Generator)

Quando o usuário solicitar a criação de uma nova escala, siga este algoritmo matemático para popular a tabela de "Plantões":

1. **Escala 12x36**: O profissional trabalha 12 horas e descansa 36 horas. 
   - Lógica de repetição: Adicione 48 horas (12 de trabalho + 36 de descanso) à `Data_Hora_Inicio` do turno anterior para encontrar o início do próximo turno. O `separation_count` (intervalo de dias) é de 1 dia pulado [7, 8].
2. **Escala 24x48**: O profissional trabalha 24 horas e descansa 48 horas.
   - Lógica de repetição: Adicione 72 horas à `Data_Hora_Inicio` anterior.
3. **Escala 24x72**: O profissional trabalha 24 horas e descansa 72 horas.
   - Lógica de repetição: Adicione 96 horas à `Data_Hora_Inicio` anterior.

**Regras de Geração:**
- Sempre gere os plantões projetando os próximos 3 meses (90 dias) a partir da `Data_Inicio` fornecida pelo usuário.
- Crie um "Implementation Plan" (Plano de Implementação) listando as primeiras 5 datas geradas para que o usuário possa revisar antes de salvar definitivamente no banco de dados [9, 10].
