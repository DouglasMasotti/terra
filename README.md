# Terra · Terrenos D / W

Painel para acompanhar os recebimentos da venda dos dois terrenos, seus saldos e a correção mensal pelo INCC-M.

## Regras acompanhadas

- Valor original: R$ 180.000 por terreno e R$ 360.000 no total.
- Amortização anual mínima: 15% do saldo atualizado no início de cada ano, somando os dois terrenos, sem depender de qual vendedor recebeu cada pagamento (R$ 54.000 em 2026 antes do INCC).
- Quitação integral do saldo corrigido até 30 de dezembro de 2030.
- Taxas INCC-M mensais editáveis de janeiro de 2026 a dezembro de 2030. Cada mês começa em 0,50% até ser ajustado.
- A regra escolhida para o painel soma as 12 taxas mensais de cada ano (0,50% por mês corresponde a 6,00%) e aplica esse percentual em janeiro seguinte apenas ao saldo restante de cada terreno.
- A simulação anual aplica a multa de mora de 2% e os juros de 1% ao mês pro rata die sobre faltas anuais somente a partir do ano seguinte; no vencimento de 30 de dezembro de 2030, mostra a multa de 2% sobre o saldo restante e a multa compensatória condicional de 10% prevista para cobrança após notificação e prazo de regularização.

## Executar localmente

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

Sem a configuração do Supabase, os dados ficam no armazenamento local do navegador.

## Publicação no GitHub Pages

O workflow em `.github/workflows/deploy-pages.yml` publica automaticamente a versão estática em cada push para `main`. O endereço do projeto é [https://douglasmasotti.github.io/terra/](https://douglasmasotti.github.io/terra/).

Ative **Settings → Pages → Build and deployment → GitHub Actions** no repositório.

## Sincronização entre dispositivos (Supabase)

1. Crie um projeto no [Supabase](https://supabase.com/dashboard) e, no **SQL Editor**, execute [`supabase/schema.sql`](supabase/schema.sql).
2. No final do script, adicione os dois e-mails que devem acessar o painel à tabela `terra_allowed_users`, substituindo os exemplos pelos e-mails reais:

   ```sql
   insert into public.terra_allowed_users (email)
   values (lower('douglas@example.com')), (lower('william@example.com'));
   ```

3. Em **Project Settings → API**, copie a **Project URL** e a chave pública **anon** (ou **publishable**). Nunca use a chave `service_role` no navegador ou no GitHub.
4. No repositório GitHub, abra **Settings → Secrets and variables → Actions → New repository secret** e crie `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com esses valores.
5. Em **Authentication → URL Configuration**, adicione `https://douglasmasotti.github.io/terra/` à lista de URLs de redirecionamento permitidas. Ative o provedor de e-mail.
6. Faça um push para `main` (ou execute manualmente o workflow de publicação). Depois que a nova versão publicar, entre em cada dispositivo pelo link enviado ao e-mail autorizado.

O primeiro acesso sincroniza taxas salvas na base; recebimentos/taxas que já estejam no armazenamento local podem ser enviados pelo botão **Importar para o Supabase** exibido no painel. Os dados do navegador local e do domínio GitHub Pages são isolados por política do navegador, então confira e importe os dados no dispositivo/origem em que eles foram registrados.
