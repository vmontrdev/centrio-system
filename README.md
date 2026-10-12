# Centrio

Sistema de gestão administrativa e planejamento e controle da manutenção.

## Etapa atual

Sistema Centrio em Next.js, TypeScript, Tailwind CSS e componentes Shadcn/ui, com tela de login responsiva e painel administrativo branco inspirado na estrutura de navegação do Supabase.

A tela de login está integrada ao Supabase Auth, com sessão em cookies, opção Manter conectado, saída da conta e recuperação de senha por e-mail. A página protegida `/inicio` apresenta a estrutura do painel: barra superior, navegação lateral recolhível, menu de conta com saída e navegação adaptada a celulares. Apenas Visão geral está disponível nesta etapa; os módulos serão adicionados individualmente. Nenhum indicador ou dado empresarial fictício é exibido. A configuração inicial e a criação do primeiro usuário são descritas em [docs/supabase.md](docs/supabase.md).

## Desenvolvimento

Na pasta do projeto, execute `npm install` na primeira configuração e `npm run dev` para iniciar. Acesse http://127.0.0.1:3000.

Deixe o servidor aberto durante o trabalho. O Next.js atualiza o navegador automaticamente quando os arquivos são salvos (Fast Refresh). Não é necessário executar o comando a cada mudança. Após reiniciar o computador ou encerrar o servidor, será necessário iniciá-lo novamente. Alterações de dependências e algumas configurações podem exigir uma reinicialização.

No Windows, você também pode abrir `iniciar-dev.cmd` com dois cliques. Mantenha a janela aberta enquanto acompanha a tela. Para parar, pressione Ctrl+C.

## Estrutura

- `apps/web`: aplicação web.
- `stack.txt`: tecnologias definidas para o sistema completo.

O Supabase fornece autenticação e PostgreSQL. O sistema atenderá uma empresa, com acesso interno e uma área limitada para clientes. As tabelas operacionais, os papéis e as permissões por cliente serão definidos nas próximas etapas. NestJS, filas e demais serviços serão adicionados conforme a necessidade.

## Verificação

- `npm run typecheck`: verifica os tipos TypeScript.
- `npm run build`: gera a versão de produção.
- `npm test`: verifica regras de segurança da autenticação.
