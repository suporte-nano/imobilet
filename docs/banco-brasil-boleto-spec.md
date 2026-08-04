# Banco do Brasil - Bloqueto

Fonte analisada: `Doc5175-Especificações Bloqueto Banco do Brasil.pdf`, documento técnico de maio/2019.

## Escopo desta etapa

O IMOBILET agora pode preparar identificadores técnicos para homologação de boleto BB, mas a emissão real ainda deve ficar bloqueada até validação bancária.

Não implementado nesta etapa:

- API Banco do Brasil;
- CNAB;
- webhook bancário;
- registro/baixa automática;
- impressão oficial de boleto para produção.

## Regras extraídas para implementação futura

- Banco: `001`.
- Moeda: `9` para Real.
- Código de barras: 44 posições.
- Campo obrigatório do código de barras:
  - posições 01-03: banco;
  - posição 04: moeda;
  - posição 05: DV do código de barras, módulo 11;
  - posições 06-09: fator de vencimento;
  - posições 10-19: valor com duas casas, sem ponto ou vírgula;
  - posições 20-44: campo livre definido pelo BB.
- Linha digitável:
  - campos 1, 2 e 3 usam DV módulo 10;
  - campo 4 usa o DV geral do código de barras;
  - campo 5 contém fator de vencimento + valor.
- Fator de vencimento:
  - base original de 07/10/1997;
  - fator `1000` em 03/07/2000;
  - fator `9999` em 21/02/2025;
  - reinício em `1000` a partir de 22/02/2025.
- Código de barras:
  - DV geral calculado por módulo 11;
  - a quinta posição nunca deve ser `0`.
- Nosso número:
  - convênio de 4 posições: `CCCCNNNNNNN-X`;
  - convênio de 6 posições: `CCCCCCNNNNN-X`;
  - convênio de 7 posições/acima de 1.000.000: `CCCCCCCNNNNNNNNNN`, sem DV no mesmo formato dos anexos VII/VIII;
  - DV do nosso número usa módulo 11 próprio do BB.
- Campo livre:
  - convênio de 4 posições: nosso número sem DV + agência + conta + carteira;
  - convênio de 6 posições: nosso número sem DV + agência + conta + carteira;
  - convênio de 7 posições: seis zeros + nosso número de 17 posições + carteira;
  - modalidade sem registro com nosso número livre de 17 posições exige convênio de 6 posições e modalidade `21`.

## Implementação adicionada

Arquivo: `src/lib/bancoBrasilBoleto.js`

Funções puras adicionadas:

- `modulo10`
- `modulo11Barcode`
- `modulo11NossoNumero`
- `calculateDueDateFactor`
- `formatAmountForBarcode`
- `buildNossoNumero`
- `buildCampoLivreBancoBrasil`
- `buildBancoBrasilBarcode`
- `buildLinhaDigitavel`
- `buildBancoBrasilBoletoIdentifiers`

## Dados ainda necessários da Lotes & Terrenos / Banco do Brasil

- número do convênio;
- agência sem DV;
- conta/código beneficiário sem DV, no formato contratado;
- carteira/modalidade de cobrança;
- regra de sequencial do nosso número;
- dados completos do beneficiário;
- aceite/homologação formal do layout gerado;
- decisão sobre boleto registrado, BolePix ou integração via API Cobrança.

## Regra de segurança

Os dados bancários reais não devem ser versionados. Use variáveis de ambiente ou tabela protegida por RLS quando a integração for ativada.
