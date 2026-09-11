import { SaleBuilder } from './SaleBuilder.js'
import { memberLevel } from './selectors.js'

export function saleActions({ getState, commit, account, post, pending }) {
  return {
    async createSale(form) {
      if (pending.has('sale')) throw new Error('A sale is already being recorded.')
      const state = getState()
      const advisor = state.advisors.find((item) => item.id === Number(form.advisorId))
      if (!advisor || (account.role === 'SALES_ADVISOR' && advisor.id !== account.advisorId)) throw new Error('Choose an advisor you can record sales for.')
      const product = state.admin.pointRules.find((item) => item.product === form.product && item.status !== 'Inactive')
      if (!product) throw new Error('Choose an active financial product.')
      const sale = new SaleBuilder().withAdvisor(advisor, state.dealership.name).withProduct(product).withAmount(form.amount).onDate(form.date).build()
      pending.add('sale')
      try {
        await post('/api/sales', { advisorId: advisor.id, dealershipId: 1, productId: product.id, financedAmount: sale.amount, saleDate: form.date })
        const points = Math.floor(sale.amount / 1000) * product.points
        commit((current) => {
          const cycleAmount = form.date.startsWith(current.cycle) ? sale.amount : 0
          const monthlySales = current.dealership.monthlySales + cycleAmount
          return {
            ...current,
            salesHistory: [sale, ...current.salesHistory],
            advisors: current.advisors.map((item) => item.id === advisor.id ? { ...item, sales: item.sales + cycleAmount, points: item.points + points, level: memberLevel(item.points + points, current.settings), availablePoints: (item.availablePoints ?? item.points) + points } : item),
            targets: current.targets.map((target) => {
              const matchesOwner = target.owner === 'Dealership' || target.advisorId === advisor.id || target.product === product.product
              return target.status === 'ACTIVE' && matchesOwner && new Date(form.date) <= new Date(target.endDate) ? { ...target, actual: target.actual + cycleAmount } : target
            }),
            dealership: { ...current.dealership, monthlySales },
            charts: { ...current.charts, monthlySales: [...current.charts.monthlySales.slice(0, -1), monthlySales] }
          }
        }, 'Sale recorded. Performance and points updated.')
      } finally { pending.delete('sale') }
    }
  }
}
