export class SaleBuilder {
  constructor() {
    this.sale = { id: crypto.randomUUID(), status: 'Recorded' }
  }

  withAdvisor(advisor, dealership) {
    this.sale.advisor = advisor.name
    this.sale.advisorId = advisor.id
    this.sale.dealership = dealership
    return this
  }

  withProduct(product) {
    this.sale.product = product.product
    this.sale.productId = product.id
    this.sale.pointsRate = product.points
    return this
  }

  withAmount(amount) {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a valid amount greater than zero.')
    this.sale.amount = value
    return this
  }

  onDate(date) {
    const value = new Date(`${date}T12:00:00`)
    if (Number.isNaN(value.getTime())) throw new Error('Choose a valid sale date.')
    if (value.toISOString().slice(0, 10) > new Date().toISOString().slice(0, 10)) throw new Error('A sale cannot be recorded in the future.')
    this.sale.date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(value)
    return this
  }

  build() {
    if (!this.sale.advisor || !this.sale.product || !this.sale.amount || !this.sale.date) throw new Error('Complete all sale details.')
    return Object.freeze({ ...this.sale })
  }
}
