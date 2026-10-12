# Configuração do Supabase

## Projeto

- URL: https://xolzcntirapryeihdaov.supabase.co
- O frontend usa apenas a chave pública Publishable, configurada em `apps/web/.env.local`.
- `.env.local` é ignorado pelo Git. Nunca colocar a chave Secret, service_role ou a senha do banco em arquivos do frontend.

## Ajustes no painel antes de usar o login

1. Em **Authentication → URL Configuration**, configure **Site URL** como `http://127.0.0.1:3000` e adicione `http://127.0.0.1:3000/auth/callback` e `http://localhost:3000/auth/callback` em **Redirect URLs**. Os dois endereços locais são aceitos no desenvolvimento. Ao recuperar a senha, abra o link no mesmo navegador e endereço em que fez a solicitação.
2. Em **Authentication → Sign In / Providers → Email**, mantenha o login por e-mail habilitado. Como os acessos serão liberados pela empresa, desabilite a criação pública de novas contas em **Allow new users to sign up**. Não existe formulário de cadastro público na aplicação.
3. Em **Authentication → Users → Add user → Create new user**, crie o primeiro usuário com seu e-mail e uma senha forte. Para esse usuário criado pelo administrador, marque **Auto Confirm User**, se a opção for exibida. Digite a senha diretamente no Supabase; não precisa enviá-la na conversa.
4. Abra `http://127.0.0.1:3000` e teste entrada e saída com esse usuário.
5. Para a recuperação, use **Esqueceu sua senha?** depois de preencher o e-mail. O link deve ser aberto no mesmo navegador em que foi solicitado, devido ao fluxo PKCE. Projetos em desenvolvimento têm limites de envio e de destinatários no serviço de e-mail padrão. Antes de usar com usuários reais, configure SMTP próprio no Supabase e valide a entrega.

O callback usa o fluxo PKCE padrão de recuperação do Supabase. Se alterar os templates de e-mail, mantenha o link de confirmação padrão `{{ .ConfirmationURL }}`. Na publicação, atualize `APP_URL`, Site URL e Redirect URLs para o domínio HTTPS definitivo.

Se o Supabase retornar `otp_expired`, o token do e-mail foi rejeitado antes de gerar a sessão. Solicite um novo e-mail e use somente o link mais recente, sem abri-lo duas vezes. Se isso ocorrer na primeira abertura imediata, verifique em Authentication → Email Templates → Reset Password se o botão usa `{{ .ConfirmationURL }}`. Serviços de e-mail com scanners que abrem links automaticamente também podem consumir links de uso único; nesse caso, será necessário usar um fluxo com confirmação explícita antes da verificação. Isso precisa ser diagnosticado com um novo envio real, sem compartilhar o token do link.

O envio padrão do Supabase tem limite de 2 e-mails por hora por projeto e intervalo padrão de 60 segundos entre pedidos de recuperação para o mesmo usuário. A aplicação espera 60 segundos após um pedido aceito ou um limite de frequência, e usa uma espera conservadora de 1 hora ao receber `over_email_send_rate_limit`. O provedor não informa o instante exato de liberação através do SDK; a contagem evita novas tentativas durante o bloqueio, sem garantir a disponibilidade ao final. Só o horário da próxima tentativa é guardado em sessionStorage, sem e-mail ou credenciais. Para testes frequentes e uso real, configure um SMTP próprio em Authentication → Email / SMTP Settings e revise os limites do projeto e do provedor.

## Funcionamento

- As credenciais são enviadas ao servidor local e deste ao Supabase Auth por HTTPS. Não são gravadas em arquivos, logs, localStorage ou no banco da aplicação.
- Os tokens de sessão ficam em cookies HttpOnly. Toda operação de autenticação passa pelo servidor; não há um cliente Auth no navegador.
- Sem **Manter conectado**, os cookies de autenticação são de sessão. Com a opção marcada, persistem por até 30 dias e mantêm essa preferência durante a renovação. Alguns navegadores podem restaurar cookies de sessão ao restaurar janelas; isso não substitui uma política de expiração no servidor.
- A página `/inicio` verifica o usuário no servidor. Apenas confirmar a presença de cookies não concede acesso.
- `/inicio` é uma tela provisória que exibe somente o e-mail da própria conta e permite sair. Não contém dados operacionais da empresa.
- Solicitações de autenticação de outras origens são recusadas e respostas de autenticação não podem ser armazenadas em cache.
- Ainda não há tabelas operacionais, papéis administrativos nem permissões da área do cliente. A empresa é única; o acesso de clientes será limitado aos próprios dados quando implementarmos essas regras e políticas RLS. Criar um usuário no Auth ainda não o torna administrador.

## Verificação

`npm test` verifica regras de cookies, validação de entrada e proteção de origem. `npm run build` verifica a compilação do frontend. O teste real com um usuário precisa ser feito após criar a conta no painel.
