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
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Os recebimentos e taxas ficam salvos no armazenamento local do navegador. Eles não são sincronizados entre navegadores ou dispositivos.

## Publicação no GitHub Pages

O workflow em `.github/workflows/deploy-pages.yml` publica automaticamente a versão estática em cada push para `main`. O endereço do projeto é [https://douglasmasotti.github.io/terra/](https://douglasmasotti.github.io/terra/).

Ative **Settings → Pages → Build and deployment → GitHub Actions** no repositório. Os recebimentos e as taxas continuam salvos apenas no navegador e não são sincronizados entre dispositivos.
