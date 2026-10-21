# Terra · Terrenos D / W

Painel para acompanhar os recebimentos da venda dos dois terrenos, seus saldos e a correção mensal pelo INCC-M.

## Regras acompanhadas

- Valor original: R$ 180.000 por terreno e R$ 360.000 no total.
- Amortização anual mínima: R$ 54.000 somando os dois terrenos, sem depender de qual vendedor recebeu cada pagamento.
- Quitação integral do saldo corrigido até 30 de dezembro de 2030.
- Taxas INCC-M mensais editáveis de janeiro de 2026 a dezembro de 2030. Cada mês começa em 0,50% até ser ajustado.
- O INCC-M de um ano é composto mês a mês e aplicado em janeiro seguinte apenas ao saldo restante de cada terreno.

## Executar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Os recebimentos e taxas ficam salvos no armazenamento local do navegador. Eles não são sincronizados entre navegadores ou dispositivos.
