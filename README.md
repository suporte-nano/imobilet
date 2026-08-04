# IMOBILET

Aplicativo de gestão imobiliária hospedado na **Hostinger Horizons**, com banco de dados e serviços de backend fornecidos pelo **Supabase**.

## Arquitetura

- **Aplicação e hospedagem:** Hostinger Horizons
- **Banco de dados e backend:** Supabase
- **Código-fonte e documentação:** GitHub
- **Branch principal:** `main`

## Segurança e privacidade

Este repositório é público, mas dados e credenciais não fazem parte do código-fonte.

Nunca publique:

- dados pessoais ou sensíveis de clientes;
- arquivos `.env` reais;
- chaves secretas ou `service_role` do Supabase;
- credenciais da Hostinger;
- backups, dumps ou exportações do banco de dados;
- logs que contenham informações pessoais, tokens ou identificadores sensíveis.

Consulte [SECURITY.md](SECURITY.md) antes de enviar alterações.

## Configuração

As credenciais devem ser configuradas diretamente nas variáveis de ambiente das plataformas autorizadas. Documente apenas os nomes das variáveis necessárias, usando valores fictícios em `.env.example`.

## Supabase

Todas as tabelas expostas pela Data API devem usar **Row Level Security (RLS)** e políticas de acesso adequadas. A chave secreta ou `service_role` nunca deve ser usada no cliente.

O módulo de recebimento de parcelas possui uma proposta de schema em [docs/supabase-receivables-schema.sql](docs/supabase-receivables-schema.sql). Revise o schema real, relações e RLS antes de aplicar em produção.

## Desenvolvimento

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

## Status

Projeto em integração a partir do export da Hostinger Horizons.
