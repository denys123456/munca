import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Building2,
  Gift,
  HeartPulse,
  History,
  Medal,
  PackageCheck,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Trophy,
  UserRoundCog,
  Users,
} from 'lucide-react'

export const navigationByRole = {
  SALES_ADVISOR: [
    item('overview', 'Overview', 'Advisor workspace', 'Your monthly command view', BarChart3),
    item('my-performance', 'My Performance', 'Performance', 'Your performance intelligence', Activity),
    item('targets', 'Targets', 'Planning', 'Targets and progress', Target),
    item('rewards', 'Rewards', 'Rewards', 'Reward catalog and status', Gift),
    item('ai-insights', 'Insights', 'AI', 'Personal insight feed', BrainCircuit),
    item('alerts', 'Alerts', 'Attention', 'Alerts and recommended actions', AlertTriangle),
    item('sales-history', 'Sales History', 'Activity', 'Recorded sales history', History),
    item('profile', 'Profile', 'Account', 'Advisor profile', UserRoundCog),
  ],
  MANAGER: [
    item('overview', 'Executive Overview', 'Manager workspace', 'Dealership command center', BarChart3),
    item('team-performance', 'Team Performance', 'Performance', 'Team performance intelligence', Activity),
    item('advisors', 'Advisors', 'People', 'Advisor portfolio', Users),
    item('targets', 'Targets', 'Planning', 'Dealership target control', Target),
    item('forecasts', 'Forecasts', 'Forecasting', 'Prediction and model quality', SlidersHorizontal),
    item('alerts', 'Alerts', 'Attention', 'Risk and opportunity alerts', AlertTriangle),
    item('leaderboard', 'Leaderboard', 'Gamification', 'Professional rankings', Trophy),
    item('rewards', 'Rewards', 'Rewards', 'Reward program status', Gift),
    item('ai-insights', 'AI Insights', 'AI', 'Management intelligence', BrainCircuit),
    item('dealership-activity', 'Dealership Activity', 'Activity', 'Sales and product activity', Building2),
  ],
  ADMIN: [
    item('admin-overview', 'Overview', 'Administration', 'Program control center', ShieldCheck),
    item('admin-users', 'Users', 'Administration', 'User management', Users),
    item('admin-dealerships', 'Dealerships', 'Administration', 'Dealership configuration', Building2),
    item('admin-products', 'Financial Products', 'Administration', 'Eligible product rules', PackageCheck),
    item('admin-point-rules', 'Point Rules', 'Administration', 'Point earning model', Medal),
    item('admin-rewards', 'Reward Catalog', 'Administration', 'Reward catalog management', Gift),
    item('admin-gamification', 'Gamification Settings', 'Administration', 'Level thresholds', Trophy),
    item('admin-targets', 'Target Configuration', 'Administration', 'Target assignment', Target),
    item('admin-health', 'System Health', 'Operations', 'Service health and fallbacks', HeartPulse),
    item('admin-audit', 'Audit / Activity', 'Operations', 'Operational activity', History),
    item('admin-settings', 'Settings', 'Administration', 'Platform settings', Settings),
  ],
}

function item(page, label, section, title, icon) {
  return { page, label, section, title, icon }
}

