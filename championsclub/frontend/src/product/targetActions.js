export function targetActions({ getState, commit, requireManager, requireDemo }) {
  function validated(form, previousName) {
    requireManager()
    requireDemo()
    if (!form.name?.trim()) throw new Error('Enter a target name.')
    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) throw new Error('Target amount must be greater than zero.')
    if (!Number.isFinite(Number(form.actual ?? 0)) || Number(form.actual ?? 0) < 0) throw new Error('Actual amount cannot be negative.')
    if (Number.isNaN(new Date(form.endDate).getTime())) throw new Error('Choose a valid end date.')
    if (getState().targets.some((item) => item.name !== previousName && item.name.toLowerCase() === form.name.trim().toLowerCase())) throw new Error('A target with that name already exists.')
    if (form.owner === 'Advisor' && !getState().advisors.some((advisor) => advisor.id === Number(form.advisorId))) throw new Error('Choose a valid advisor.')
    return { ...form, name: form.name.trim(), amount: Number(form.amount), actual: Number(form.actual ?? 0), advisorId: form.owner === 'Advisor' ? Number(form.advisorId) : undefined }
  }
  return {
    updateTarget(name, patch) {
      const previous = getState().targets.find((item) => item.name === name)
      if (!previous) throw new Error('This target no longer exists.')
      const target = validated({ ...previous, ...patch }, name)
      commit((state) => ({
        ...state,
        targets: state.targets.map((item) => item.name === name ? target : item),
        dealership: target.primary && target.owner === 'Dealership' ? { ...state.dealership, monthlyTarget: target.amount, monthlySales: target.actual } : state.dealership,
        advisors: target.primary && target.owner === 'Advisor' ? state.advisors.map((advisor) => advisor.id === target.advisorId ? { ...advisor, target: target.amount, sales: target.actual } : advisor) : state.advisors
      }), 'Target updated.')
    },
    createTarget(form) {
      const target = validated({ ...form, actual: 0 })
      commit((state) => ({ ...state, targets: [...state.targets, target] }), 'Target created.')
    }
  }
}
