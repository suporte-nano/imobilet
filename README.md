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

As credenciais devem ser configuradas diretamente nas variáveis de ambiente das plataformas autorizadas. Quando o código-fonte for adicionado, documente apenas os nomes das variáveis necessárias, usando valores fictícios em um arquivo `.env.example`.

## Supabase

Todas as tabelas expostas pela Data API devem usar **Row Level Security (RLS)** e políticas de acesso adequadas. A chave secreta ou `service_role` nunca deve ser usada no cliente.

## Desenvolvimento

O código exportado da Hostinger Horizons será incorporado ao repositório em uma próxima etapa. Depois disso, esta seção deverá incluir os comandos reais de instalação, desenvolvimento, testes e build.

## Status

Configuração inicial do repositório em andamento.
