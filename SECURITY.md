# Política de Segurança

## Escopo

Este repositório contém o código do IMOBILET. O aplicativo é hospedado na Hostinger Horizons e utiliza o Supabase para banco de dados e serviços de backend.

## Dados que nunca devem ser publicados

- dados pessoais ou sensíveis de clientes;
- arquivos de exportação, backups ou dumps do banco;
- senhas, tokens, cookies ou credenciais;
- chaves secretas ou `service_role` do Supabase;
- credenciais da Hostinger ou de qualquer serviço externo;
- arquivos `.env` reais.

Use somente valores fictícios em exemplos de configuração. Credenciais de produção devem permanecer nas variáveis de ambiente das plataformas autorizadas.

## Relato de vulnerabilidades

Não abra uma issue pública contendo vulnerabilidades, dados pessoais, credenciais ou outros segredos. Use o recurso privado **Security Advisories** deste repositório para relatar problemas de segurança.

## Supabase

- habilite RLS em todas as tabelas expostas pela Data API;
- aplique políticas de acesso específicas por usuário ou organização;
- nunca envie chaves secretas para aplicações cliente;
- trate a chave pública/publishable como identificador público, mantendo a segurança efetiva nas políticas RLS;
- revise permissões antes de colocar novas tabelas, views, funções ou buckets em produção.

## Resposta a incidente

Se uma credencial for publicada acidentalmente:

1. revogue ou rotacione a credencial imediatamente;
2. remova o segredo do código e do histórico do Git;
3. verifique logs de acesso e ações suspeitas;
4. revise RLS e permissões relacionadas;
5. documente as medidas corretivas sem expor dados sensíveis.
