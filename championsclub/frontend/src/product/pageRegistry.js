export function getDefaultPageForRole(role) {
  if (role === 'ADMIN') {
    return 'admin-overview'
  }
  return 'overview'
}

