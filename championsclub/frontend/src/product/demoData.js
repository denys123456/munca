export const demoAccounts = [
  {
    id: 'jane-advisor',
    name: 'Jane Doe',
    email: 'jane.doe@championsclub.example',
    role: 'SALES_ADVISOR',
    title: 'Sales Advisor',
    avatar: 'JD',
    dealership: 'Apex North Motors',
  },
  {
    id: 'alex-manager',
    name: 'Alex Smith',
    email: 'alex.smith@championsclub.example',
    role: 'MANAGER',
    title: 'Performance Manager',
    avatar: 'AS',
    dealership: 'Apex North Motors',
  },
  {
    id: 'john-admin',
    name: 'John Doe',
    email: 'john.doe@championsclub.example',
    role: 'ADMIN',
    title: 'Platform Administrator',
    avatar: 'JO',
    dealership: 'ChampionsClub Operations',
  },
]

export const demoProductData = {
  currentUser: {
    name: 'Alex Smith',
    email: 'alex.smith@championsclub.example',
    role: 'MANAGER',
    title: 'Performance Manager',
    avatar: 'AS',
    dealership: 'Apex North Motors',
  },
  dealership: {
    name: 'Apex North Motors',
    city: 'Cluj-Napoca',
    region: 'North West',
    monthlySales: 312400,
    monthlyTarget: 420000,
    previousCycleSales: 284200,
    advisorsAtRisk: 2,
    topPerformer: 'Alex Smith',
    sustainableSalesShare: 38,
  },
  forecast: {
    predictedSales: 438000,
    targetAchievementProbability: 0.78,
    confidence: 0.84,
    trend: 'UP',
    modelQuality: 'Healthy',
    assumptions: [
      'Renewal conversations remain above last month pace',
      'Fleet Advantage demand stays stable',
      'No major advisor inactivity period is detected',
    ],
    anomalyHints: ['Service Protection volume is below expected range'],
  },
  advisors: [
    advisor(1, 'Jane Doe', 'Sales Advisor', 118500, 140000, 1330, 'SILVER', 'On Track', 'Medium', 72),
    advisor(2, 'John Doe', 'Sales Advisor', 68500, 125000, 615, 'BRONZE', 'Needs Coaching', 'High', 39),
    advisor(3, 'Alex Smith', 'Senior Sales Advisor', 151200, 145000, 2370, 'SILVER', 'Accelerating', 'Low', 86),
    advisor(5, 'Morgan Lee', 'Service Advisor', 74200, 110000, 880, 'BRONZE', 'On Track', 'Medium', 58),
    advisor(8, 'Riley Carter', 'Sales Advisor', 98200, 120000, 1210, 'SILVER', 'On Track', 'Low', 66),
  ],
  targets: [
    target('Dealership monthly target', 'Dealership', 420000, 312400, 'ACTIVE', '30 Sep 2026'),
    target('Jane Doe individual target', 'Advisor', 140000, 118500, 'ACTIVE', '30 Sep 2026'),
    target('Alex Smith renewal focus', 'Advisor', 145000, 151200, 'COMPLETED', '30 Sep 2026'),
    target('Service Protection recovery', 'Product', 85000, 51600, 'ACTIVE', '30 Sep 2026'),
  ],
  rewards: [
    reward(1, 'Premium Fuel Voucher', 'Mobility', 650, 'Available', 42),
    reward(2, 'Dealer Partner Experience', 'Experience', 1400, 'Close', 64),
    reward(3, 'Home Technology Voucher', 'Lifestyle', 2200, 'Locked', 28),
    reward(4, 'Sustainable Travel Voucher', 'Travel', 3000, 'Locked', 18),
    reward(5, 'Professional Development Pass', 'Growth', 1800, 'Close', 51),
  ],
  redemptions: [
    { reward: 'Premium Fuel Voucher', advisor: 'Jane Doe', points: 650, status: 'Completed', date: '04 Sep 2026' },
    { reward: 'Dealer Partner Experience', advisor: 'Alex Smith', points: 1400, status: 'Approved', date: '02 Sep 2026' },
  ],
  alerts: [
    alert('TARGET_RISK', 'WARNING', 'John Doe below target pace', 'Coach on eligible finance conversion this week.', 'Advisor Risk'),
    alert('CLOSE_TO_GOLD', 'INFO', 'Alex Smith close to Gold', 'One high-value Fleet Advantage sale can unlock Gold.', 'Gamification'),
    alert('SALES_DECLINE', 'WARNING', 'Service Protection decline', 'Attach-rate fell compared with the previous cycle.', 'Product Mix'),
    alert('EXCEPTIONAL_PERFORMANCE', 'INFO', 'Renewal pipeline accelerating', 'September renewal conversations are ahead of plan.', 'Opportunity'),
  ],
  salesHistory: [
    sale('Jane Doe', 'Classic Financing', 38500, 'Recorded', '08 Sep 2026'),
    sale('Alex Smith', 'Fleet Advantage', 61200, 'Recorded', '07 Sep 2026'),
    sale('Riley Carter', 'Leasing Plus', 44800, 'Recorded', '06 Sep 2026'),
    sale('John Doe', 'Service Protection', 18500, 'Recorded', '05 Sep 2026'),
    sale('Morgan Lee', 'Leasing Plus', 33200, 'Recorded', '04 Sep 2026'),
    sale('Jane Doe', 'Service Protection', 27600, 'Recorded', '02 Sep 2026'),
  ],
  charts: {
    monthlySales: [188000, 204000, 238000, 252000, 284200, 312400],
    targetProgress: [52, 58, 63, 67, 71, 74],
    pointsTrend: [420, 760, 980, 1140, 1330, 1510],
    productMix: [
      { label: 'Leasing Plus', value: 36 },
      { label: 'Classic Financing', value: 29 },
      { label: 'Fleet Advantage', value: 23 },
      { label: 'Service Protection', value: 12 },
    ],
  },
  aiInsights: {
    summary: 'The dealership is building strong renewal momentum while Service Protection needs sharper attachment discipline.',
    whatChanged: [
      'Fleet Advantage moved from third to second largest product contributor',
      'Advisor spread widened between top performers and lower activity advisors',
      'Reward engagement improved after the September catalogue refresh',
    ],
    needsAttention: [
      'John Doe needs immediate coaching on qualification and follow-up cadence',
      'Service Protection attach-rate should be reviewed in the next sales meeting',
    ],
    nextActions: [
      'Run a 20 minute renewal pipeline review with advisors below 60 percent target progress',
      'Move Alex Smith into a peer coaching role for Fleet Advantage conversations',
      'Promote rewards that are within 300 points for Silver-level advisors',
    ],
  },
  admin: {
    users: [
      { name: 'Jane Doe', email: 'jane.doe@championsclub.example', role: 'SALES_ADVISOR', status: 'Active' },
      { name: 'Alex Smith', email: 'alex.smith@championsclub.example', role: 'MANAGER', status: 'Active' },
      { name: 'John Doe', email: 'john.doe@championsclub.example', role: 'ADMIN', status: 'Active' },
    ],
    dealerships: [
      { name: 'Apex North Motors', city: 'Cluj-Napoca', region: 'North West', status: 'Active' },
      { name: 'Apex Mobility Center', city: 'Bucharest', region: 'South', status: 'Active' },
      { name: 'Apex Financial Hub West', city: 'Timisoara', region: 'West', status: 'Active' },
    ],
    pointRules: [
      { product: 'Classic Financing', points: 12, reason: 'Baseline finance product' },
      { product: 'Leasing Plus', points: 16, reason: 'Strategic growth product' },
      { product: 'Service Protection', points: 9, reason: 'Retention attachment product' },
    ],
    systemHealth: [
      { service: 'Spring Boot API', status: 'Ready', detail: 'Core business workflows available' },
      { service: 'PostgreSQL', status: 'Ready', detail: 'Flyway schema managed' },
      { service: 'ML Forecasting', status: 'Degraded gracefully', detail: 'Fallback state is component scoped' },
      { service: 'LLM Provider', status: 'Mocked', detail: 'Provider boundary configured' },
    ],
  },
}

function advisor(id, name, title, sales, target, points, level, status, risk, forecastProbability) {
  return { id, name, title, sales, target, points, level, status, risk, forecastProbability }
}

function target(name, owner, amount, actual, status, endDate) {
  return { name, owner, amount, actual, status, endDate }
}

function reward(id, name, category, points, status, progress) {
  return { id, name, category, points, status, progress }
}

function alert(type, severity, title, message, group) {
  return { type, severity, title, message, group, isUnread: true }
}

function sale(advisor, product, amount, status, date) {
  return { advisor, product, amount, status, date, dealership: 'Apex North Motors' }
}
