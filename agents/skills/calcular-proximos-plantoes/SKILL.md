ame: calcular-proximos-plantoes
description: Skill para gerar automaticamente os plantões futuros até o final do ano com base na escala (12x36, 24x48, 24x72) e data inicial.
---

# Lógica de Geração de Plantões

**Objetivo:** Gerar as instâncias futuras de plantões com base em um padrão de escala e salvar no banco de dados.

**Entradas Recebidas do Frontend:**
- `data_inicial_escala` (Timestamp do primeiro plantão)
- `regra_escala` (String: "12x36", "24x48", "24x72")
- `id_local_trabalho` (UUID)
- `id_usuario` (UUID)

**Processo de Cálculo (Motor Matemático):**
1. O ponto de partida é a `data_inicial_escala`.
2. Identifique o padrão de recorrência para calcular a próxima data de início [6]:
   - **12x36:** Trabalha 12h, folga 36h. Ciclo = Adicionar 48 horas (2 dias) à data inicial anterior.
   - **24x48:** Trabalha 24h, folga 48h. Ciclo = Adicionar 72 horas (3 dias) à data inicial anterior.
   - **24x72:** Trabalha 24h, folga 72h. Ciclo = Adicionar 96 horas (4 dias) à data inicial anterior.
3. Crie um loop (laço de repetição) que gere instâncias contínuas de plantões projetando essas datas até o dia **31 de dezembro do ano atual**.

**Saída e Persistência:**
- O resultado deve ser um array de objetos de plantão.
- Realize uma inserção em lote (Bulk Insert) na tabela `Plantoes` associando cada registro ao `id_usuario`, `id_local_trabalho` e à escala correspondente [7, 8].