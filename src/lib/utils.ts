const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function fmtBRL(value: number): string {
  return brlFormatter.format(value)
}
