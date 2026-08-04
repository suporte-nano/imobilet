# Mapeamento inicial de tabelas usadas pelo IMOBILET

Encontrado no código React/Supabase atual:

- `properties`: cadastro de imóveis/lotes, documentos, fotos, preço, sinal e condições de parcelamento.
- `buyers`: cadastro de compradores e possível vínculo `property_id`.
- `customers`: usado no módulo de backup/importação.
- `brokers`: cadastro de corretores.
- `payable_accounts`: contas a pagar e pagamentos internos de despesas.

Novas tabelas propostas para recebimento:

- `sales_contracts`: vínculo explícito entre imóvel vendido e comprador.
- `installments`: agenda financeira de parcelas do contrato.
- `payments`: lançamentos manuais de pagamentos recebidos.
- `financial_audit_logs`: trilha de auditoria financeira.

Regra de segurança adotada:

Compradores sem `property_id` não devem gerar contrato automaticamente. O módulo apenas exibe aviso visual para revisão manual.
