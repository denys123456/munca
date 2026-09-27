import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Database,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { useResource } from "../api/ApiContext.jsx";
import { query, request } from "../api/client.js";
import { date, label, money, number, percent } from "../lib/format.js";

const quickPrompts = [
  "Top 3 advisors by sales",
  "Which product has the most contracts?",
  "How far are we from target pace?",
  "What alerts need attention?",
];

const romanianHints = [
  "care", "cine", "cat", "cate", "cati", "vanzari", "vanzare", "contracte", "tinta",
  "echipa", "agenti", "consilieri", "produse", "alerte", "risc", "compara", "ramas", "peste", "sub", "pana",
];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(question, words) {
  return words.some((word) => question.includes(normalize(word)));
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function topBy(items, getter, lowest = false) {
  if (!items?.length) return null;
  return [...items].sort((a, b) => {
    const delta = safeNumber(getter(b)) - safeNumber(getter(a));
    return lowest ? -delta : delta;
  })[0];
}

function sortedBy(items, getter, lowest = false) {
  return [...(items || [])].sort((a, b) => {
    const delta = safeNumber(getter(b)) - safeNumber(getter(a));
    return lowest ? -delta : delta;
  });
}

function findMentions(items, question, getTerms) {
  return (items || [])
    .map((item) => {
      const matches = getTerms(item)
        .filter(Boolean)
        .map((term) => normalize(term))
        .filter((term) => term.length > 2 && question.includes(term));
      const score = matches.reduce((max, value) => Math.max(max, value.length), 0);
      const position = matches.length
        ? Math.min(...matches.map((value) => question.indexOf(value)).filter((value) => value >= 0))
        : Number.MAX_SAFE_INTEGER;
      return { item, score, position };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => a.position - b.position || b.score - a.score)
    .map((entry) => entry.item);
}

function advisorName(advisor) {
  return advisor?.advisorName
    || advisor?.displayName
    || [advisor?.firstName, advisor?.lastName].filter(Boolean).join(" ")
    || "Unknown advisor";
}

function extractTopN(question, fallback = 1) {
  const numeric = question.match(/(?:top|primii|primele|cei mai buni|cele mai bune)\s+(\d{1,2})/);
  if (numeric) return Math.min(10, Math.max(1, Number(numeric[1])));
  if (includesAny(question, ["top three", "top 3", "primii trei", "primele trei"])) return 3;
  if (includesAny(question, ["top five", "top 5", "primii cinci", "primele cinci"])) return 5;
  if (includesAny(question, ["second", "2nd", "al doilea", "a doua"])) return 2;
  if (includesAny(question, ["third", "3rd", "al treilea", "a treia"])) return 3;
  return fallback;
}

function ordinalOnly(question) {
  if (includesAny(question, ["first", "1st", "number one", "primul", "prima", "locul 1", "who is 1", "cine e 1", "cine este 1"])) return 1;
  if (includesAny(question, ["second", "2nd", "al doilea", "a doua", "locul 2"])) return 2;
  if (includesAny(question, ["third", "3rd", "al treilea", "a treia", "locul 3"])) return 3;
  return null;
}

function wantsLowest(question) {
  return includesAny(question, [
    "lowest", "least", "worst", "smallest", "minimum", "bottom", "cel mai mic", "cea mai mica",
    "cele mai mici", "cel mai slab", "cea mai slaba", "ultimul", "ultima",
  ]);
}

function wantsContracts(question) {
  return includesAny(question, ["contract", "contracts", "contracte", "tranzactii", "transactions", "volume"]);
}

function wantsSales(question) {
  return includesAny(question, ["sales", "revenue", "value", "amount", "vanzari", "valoare", "incasari"]);
}

function wantsShare(question) {
  return includesAny(question, ["share", "pondere", "procent", "percentage", "%"]);
}

function wantsList(question) {
  return includesAny(question, ["list", "show me", "arata", "top", "bottom", "primii", "primele", "care sunt", "cine sunt"]);
}

function isRomanian(question) {
  const words = new Set(normalize(question).split(" ").filter(Boolean));
  return romanianHints.some((word) => words.has(word));
}

function buildSnapshot(data, leaderboardRows = [], advisorRows = [], alertRows = []) {
  const performance = data?.performance || {};
  const analytics = performance.analytics || {};
  const target = performance.target || {};
  const progress = target.progress || {};
  const team = data?.teamStatistics || {};
  const forecastEnvelope = performance.forecast || {};
  const forecast = forecastEnvelope.result || {};

  const rankingRows = leaderboardRows.length ? leaderboardRows : (data?.leaderboard || []);
  const performanceByAdvisor = new Map(
    rankingRows.map((row) => [String(row?.advisor?.advisorId), row]),
  );
  const managerAlerts = alertRows.length ? alertRows : (data?.alerts || []);

  const advisors = advisorRows.length
    ? advisorRows.map((advisor) => {
        const ranking = performanceByAdvisor.get(String(advisor.id));
        return {
          advisorId: advisor.id,
          advisorName: [advisor.firstName, advisor.lastName].filter(Boolean).join(" "),
          email: advisor.email,
          advisorType: advisor.advisorType,
          rank: ranking?.rank ?? null,
          sales: ranking?.advisor?.sales ?? null,
          contracts: ranking?.advisor?.transactions ?? null,
          target: ranking?.advisor?.target ?? null,
          achievementPercentage: ranking?.achievementPercentage ?? null,
          tier: ranking?.gamification?.currentLevel ?? null,
          lifetimeEarnedPoints: ranking?.advisor?.lifetimeEarnedPoints ?? null,
          lastSaleDate: ranking?.advisor?.lastSaleDate ?? null,
        };
      })
    : rankingRows.map((row) => ({
        advisorId: row.advisor?.advisorId,
        advisorName: row.advisor?.advisorName,
        advisorType: row.advisor?.advisorType,
        rank: row.rank,
        sales: row.advisor?.sales,
        contracts: row.advisor?.transactions,
        target: row.advisor?.target,
        achievementPercentage: row.achievementPercentage,
        tier: row.gamification?.currentLevel,
        lifetimeEarnedPoints: row.advisor?.lifetimeEarnedPoints,
        lastSaleDate: row.advisor?.lastSaleDate,
      }));

  const alertCounts = managerAlerts.reduce((counts, alert) => {
    const severity = alert.severity || "UNKNOWN";
    counts.bySeverity[severity] = (counts.bySeverity[severity] || 0) + 1;
    const type = alert.type || "UNKNOWN";
    counts.byType[type] = (counts.byType[type] || 0) + 1;
    if (!alert.readAt) counts.unread += 1;
    if (!alert.resolvedAt) counts.unresolved += 1;
    return counts;
  }, { bySeverity: {}, byType: {}, unread: 0, unresolved: 0 });

  return {
    metricDefinitions: {
      "sales.value": "Recorded sales value for the current target period up to reportingDate.",
      "target.achievementPercentage": "Recorded sales divided by the full configured target amount for the whole target period.",
      "target.currentAveragePace": "Average recorded sales per elapsed day in the current target period.",
      "target.requiredAveragePace": "Average sales per remaining day required to finish the full target period at target.",
      "advisors[].achievementPercentage": "Advisor sales divided by the prorated expected target-to-date for the selected period. 100% means exactly on expected pace so far, not necessarily 100% of the full-month target.",
      "forecast.targetAchievementProbabilityPercentage": "ML estimate of the probability of reaching the full configured target by period end, expressed as a percentage.",
      "forecast.confidencePercentage": "Reliability/confidence value returned by the ML forecast service, expressed as a percentage.",
    },
    scope: {
      dealership: data?.dealership?.name,
      dealershipId: data?.identity?.dealershipId,
      reportingDate: performance.reportingDate,
      periodStart: analytics.periodStart,
      periodEnd: analytics.periodEnd,
      note: "All current-period actuals stop at reportingDate. Forecast values may extend to target period end.",
    },
    sales: {
      value: analytics.sales,
      recordedContracts: analytics.recordedContracts,
      cancelledContracts: analytics.cancelledContracts,
      averageContractAmount: analytics.averageContractAmount,
      cancellationRatePercentage: analytics.cancellationRatePercentage,
      previousPeriodSales: analytics.previousPeriodSales,
      previousPeriodRecordedContracts: analytics.previousPeriodRecordedContracts,
      salesGrowthPercentage: analytics.salesGrowthPercentage,
      contractGrowthPercentage: analytics.contractGrowthPercentage,
    },
    target: {
      amount: progress.targetAmount,
      achieved: progress.achievedAmount,
      remaining: progress.remainingAmount,
      achievementPercentage: progress.achievementPercentage,
      currentAveragePace: progress.currentAveragePace,
      requiredAveragePace: progress.requiredAveragePace,
      daysRemaining: progress.daysRemaining,
      status: progress.status,
      periodStart: target.periodStart,
      periodEnd: target.periodEnd,
    },
    forecast: {
      state: forecastEnvelope.state,
      generatedAt: forecastEnvelope.generatedAt,
      predictedEndValue: forecast.predictedEndValue,
      targetAchievementProbabilityPercentage:
        forecast.targetAchievementProbability === null || forecast.targetAchievementProbability === undefined
          ? null
          : safeNumber(forecast.targetAchievementProbability) * 100,
      confidencePercentage:
        forecast.confidence === null || forecast.confidence === undefined
          ? null
          : safeNumber(forecast.confidence) * 100,
      lowerBound: forecast.lowerBound,
      upperBound: forecast.upperBound,
      trend: forecast.trend,
    },
    team: {
      totalAdvisors: team.totalAdvisors,
      advisorsWithSales: team.advisorsWithSales,
      salesAdvisors: team.salesAdvisors,
      serviceAdvisors: team.serviceAdvisors,
      recordedContracts: team.recordedContracts,
      cancelledContracts: team.cancelledContracts,
      sales: team.sales,
      averageContractAmount: team.averageContractAmount,
      productsWithSales: team.activeProducts,
    },
    advisors,
    leaderboard: rankingRows.map((row) => ({
      rank: row.rank,
      advisorId: row.advisor?.advisorId,
      advisorName: row.advisor?.advisorName,
      advisorType: row.advisor?.advisorType,
      sales: row.advisor?.sales,
      contracts: row.advisor?.transactions,
      target: row.advisor?.target,
      achievementPercentage: row.achievementPercentage,
      tier: row.gamification?.currentLevel,
      lifetimeEarnedPoints: row.advisor?.lifetimeEarnedPoints,
      lastSaleDate: row.advisor?.lastSaleDate,
    })),
    atRiskAdvisors: (data?.atRiskAdvisors || []).map((row) => ({
      advisorId: row.advisorId,
      advisorName: row.advisorName,
      advisorType: row.advisorType,
      sales: row.sales,
      contracts: row.transactions,
      target: row.target,
      lastSaleDate: row.lastSaleDate,
    })),
    products: analytics.productMix || [],
    categories: analytics.productCategoryMix || [],
    customerSegments: analytics.customerSegmentMix || [],
    powertrains: analytics.powertrainMix || [],
    vehicleConditions: analytics.vehicleConditionMix || [],
    alerts: managerAlerts.map((alert) => ({
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      relatedEntityType: alert.relatedEntityType,
      relatedEntityId: alert.relatedEntityId,
      createdAt: alert.createdAt,
      read: Boolean(alert.readAt),
      resolved: Boolean(alert.resolvedAt),
    })),
    alertCounts,
    recommendations: (data?.recommendations || []).map((item) => ({
      type: item.type,
      priority: item.priority,
      title: item.title,
      action: item.action,
      reason: item.reason,
      supportingFacts: item.supportingFacts,
    })),
    recentSales: (data?.recentActivity || []).map((sale) => ({
      date: sale.saleDate,
      amount: sale.contractAmount,
      status: sale.status,
      productName: sale.productName,
      advisorName: sale.advisorName,
      advisorId: sale.advisorId,
      reference: sale.externalReference,
    })),
  };
}

function dimensionLine(item, metric = "contracts") {
  if (!item) return "—";
  if (metric === "sales") {
    return `${label(item.value)} — ${money(item.sales)} from ${number(item.transactions)} contracts`;
  }
  if (metric === "share") {
    return `${label(item.value)} — ${percent(item.transactionSharePercentage)} of contracts (${number(item.transactions)})`;
  }
  return `${label(item.value)} — ${number(item.transactions)} contracts and ${money(item.sales)} sales`;
}

function productLine(item, metric = "sales") {
  if (!item) return "—";
  if (metric === "contracts") return `${item.productName} — ${number(item.transactions)} contracts (${money(item.sales)})`;
  if (metric === "share") return `${item.productName} — ${percent(item.salesSharePercentage)} of sales (${money(item.sales)})`;
  return `${item.productName} — ${money(item.sales)} from ${number(item.transactions)} contracts`;
}

function advisorLine(item, metric = "rank") {
  if (!item) return "—";
  const name = advisorName(item);
  if (metric === "sales") return `${name} — ${money(item.sales)} · ${number(item.contracts)} contracts · rank #${number(item.rank)}`;
  if (metric === "contracts") return `${name} — ${number(item.contracts)} contracts · ${money(item.sales)} · rank #${number(item.rank)}`;
  if (metric === "points") return `${name} — ${number(item.lifetimeEarnedPoints)} lifetime points · ${label(item.tier)} · rank #${number(item.rank)}`;
  if (metric === "achievement") return `${name} — ${percent(item.achievementPercentage)} of expected target-to-date · ${money(item.sales)} sales`;
  return `#${number(item.rank)} ${name} — ${percent(item.achievementPercentage)} target pace · ${money(item.sales)} sales`;
}

function compareTwo(labelA, a, labelB, b, rows) {
  return `${labelA}: ${rows(a)}\n${labelB}: ${rows(b)}`;
}

function contextualQuestion(rawQuestion, history = []) {
  const current = normalize(rawQuestion);
  const words = current.split(" ").filter(Boolean);
  const followUp = words.length <= 7 && includesAny(current, [
    "and", "but", "second", "third", "what about", "dar", "si", "al doilea", "al treilea", "asta", "acolo",
  ]);
  if (!followUp) return current;
  const previous = [...history].reverse().find((message) => message.role === "user" && message.text);
  return previous ? `${normalize(previous.text)} ${current}` : current;
}

function localAnswer(rawQuestion, stats, history = []) {
  const qCurrent = normalize(rawQuestion);
  const q = contextualQuestion(rawQuestion, history);
  const ro = isRomanian(rawQuestion);
  const { sales, target, team, forecast } = stats;

  if (!qCurrent) return ro ? "Întreabă-mă ceva despre statisticile managerului." : "Ask me a manager statistics question.";

  if (includesAny(qCurrent, ["help", "what can you", "ce poti", "examples", "exemple", "ajutor"])) {
    return ro
      ? "Pot răspunde la întrebări libere despre vânzări, contracte, target și ritm, forecast, top/bottom advisors, comparații între advisors, produse și categorii, segmente de clienți, powertrain, alerte și recomandări. Exemple: „top 3 agenți după vânzări”, „compară Sam cu Morgan”, „ce produs are cele mai multe contracte?”, „cât ne mai lipsește din target?”"
      : "I can answer free-form questions about sales, contracts, target pace, forecasts, top/bottom advisors, advisor comparisons, products and categories, customer segments, powertrains, alerts and grounded recommendations. Try: “top 3 advisors by sales”, “compare Sam with Morgan”, “which product has most contracts?” or “how far are we from target?”";
  }

  if (includesAny(qCurrent, ["json", "data scope", "source data", "datele folosite", "sursa datelor", "pana cand sunt datele"])) {
    return ro
      ? `Folosesc snapshot-ul verificat pentru ${stats.scope.dealership || "dealership"}, perioada ${date(stats.scope.periodStart)} – ${date(stats.scope.periodEnd)}, cu date reale înregistrate până la ${date(stats.scope.reportingDate)}.`
      : `I use the verified snapshot for ${stats.scope.dealership || "this dealership"}, covering ${date(stats.scope.periodStart)} – ${date(stats.scope.periodEnd)}, with actual recorded data through ${date(stats.scope.reportingDate)}.`;
  }

  const mentionedAdvisors = findMentions(stats.advisors, q, (item) => [advisorName(item), item.email]);
  const mentionedProducts = findMentions(stats.products, q, (item) => [item.productName, item.productCode]);
  const mentionedSegments = findMentions(stats.customerSegments, q, (item) => [item.value, label(item.value)]);
  const mentionedPowertrains = findMentions(stats.powertrains, q, (item) => [item.value, label(item.value)]);
  const mentionedCategories = findMentions(stats.categories, q, (item) => [item.value, label(item.value)]);
  const mentionedConditions = findMentions(stats.vehicleConditions, q, (item) => [item.value, label(item.value)]);

  if (includesAny(q, ["compare", "versus", " vs ", "diferenta", "compara"]) && mentionedAdvisors.length >= 2) {
    const [a, b] = mentionedAdvisors;
    return compareTwo(advisorName(a), a, advisorName(b), b, (item) =>
      `${money(item.sales)} sales · ${number(item.contracts)} contracts · ${percent(item.achievementPercentage)} target pace · rank #${number(item.rank)}`,
    );
  }

  if (includesAny(q, ["compare", "versus", " vs ", "diferenta", "compara"]) && mentionedProducts.length >= 2) {
    const [a, b] = mentionedProducts;
    return compareTwo(a.productName, a, b.productName, b, (item) =>
      `${money(item.sales)} sales · ${number(item.transactions)} contracts · ${percent(item.salesSharePercentage)} sales share`,
    );
  }

  if (mentionedAdvisors.length === 1) {
    const advisor = mentionedAdvisors[0];
    if (includesAny(q, ["risk", "risc", "at risk", "in urma", "behind"])) {
      const atRisk = stats.atRiskAdvisors.some((item) => String(item.advisorId) === String(advisor.advisorId));
      return atRisk
        ? `${advisorName(advisor)} is currently flagged at risk. ${advisorLine(advisor, "achievement")}.`
        : `${advisorName(advisor)} is not in the current at-risk list. ${advisorLine(advisor, "achievement")}.`;
    }
    if (includesAny(q, ["points", "puncte", "tier", "level", "nivel"])) {
      return `${advisorName(advisor)} is ${label(advisor.tier)} with ${number(advisor.lifetimeEarnedPoints)} lifetime points. Current rank: #${number(advisor.rank)}.`;
    }
    if (includesAny(q, ["rank", "ranking", "pozitie", "loc"])) return advisorLine(advisor, "rank");
    if (includesAny(q, ["target", "tinta", "goal", "remaining", "ramas", "lipseste"])) {
      const gap = safeNumber(advisor.target) - safeNumber(advisor.sales);
      return ro
        ? `${advisorName(advisor)} are ${money(advisor.sales)} vânzări față de ${money(advisor.target)} target-to-date (${percent(advisor.achievementPercentage)}). ${gap > 0 ? `Mai lipsesc ${money(gap)}.` : `Este cu ${money(Math.abs(gap))} peste target-to-date.`}`
        : `${advisorName(advisor)} has ${money(advisor.sales)} in sales against a ${money(advisor.target)} target-to-date (${percent(advisor.achievementPercentage)}). ${gap > 0 ? `${money(gap)} remains.` : `That is ${money(Math.abs(gap))} above target-to-date.`}`;
    }
    if (wantsContracts(q)) return advisorLine(advisor, "contracts");
    if (wantsSales(q)) return advisorLine(advisor, "sales");
    return advisorLine(advisor, "achievement");
  }

  if (mentionedProducts.length === 1 && includesAny(q, ["who", "cine", "advisor", "agent", "consultant"])) {
    return ro
      ? `Pot vedea performanța totală pentru ${mentionedProducts[0].productName}, dar snapshot-ul verificat nu conține defalcarea produs × advisor. Nu vreau să inventez cine a vândut cel mai mult acest produs.`
      : `I can see total performance for ${mentionedProducts[0].productName}, but the verified snapshot does not contain a product-by-advisor breakdown, so I cannot truthfully name the advisor who sold the most of it.`;
  }

  if (mentionedProducts.length === 1) {
    const product = mentionedProducts[0];
    if (wantsContracts(q)) return productLine(product, "contracts");
    if (wantsShare(q)) return productLine(product, "share");
    return productLine(product, "sales");
  }

  if (mentionedSegments.length === 1) return dimensionLine(mentionedSegments[0], wantsSales(q) ? "sales" : wantsShare(q) ? "share" : "contracts");
  if (mentionedPowertrains.length === 1) return dimensionLine(mentionedPowertrains[0], wantsSales(q) ? "sales" : wantsShare(q) ? "share" : "contracts");
  if (mentionedCategories.length === 1) return dimensionLine(mentionedCategories[0], wantsSales(q) ? "sales" : wantsShare(q) ? "share" : "contracts");
  if (mentionedConditions.length === 1) return dimensionLine(mentionedConditions[0], wantsSales(q) ? "sales" : wantsShare(q) ? "share" : "contracts");

  if (includesAny(q, ["forecast", "prediction", "predictie", "probability", "probabilitate", "sanse", "will we hit", "atingem target", "ajungem la target"])) {
    if (!forecast?.predictedEndValue) {
      return ro ? "Forecastul ML nu este disponibil în snapshot-ul curent." : "The ML forecast is not available in the current verified snapshot.";
    }
    const delta = safeNumber(forecast.predictedEndValue) - safeNumber(target.amount);
    const relation = delta >= 0 ? "above" : "below";
    return ro
      ? `Forecastul estimează ${money(forecast.predictedEndValue)} la finalul perioadei, cu ${percent(forecast.targetAchievementProbabilityPercentage)} probabilitate de atingere a targetului și ${percent(forecast.confidencePercentage)} reliability. Predicția este cu ${money(Math.abs(delta))} ${delta >= 0 ? "peste" : "sub"} targetul de ${money(target.amount)}.`
      : `The forecast estimates ${money(forecast.predictedEndValue)} at period end, with ${percent(forecast.targetAchievementProbabilityPercentage)} target-achievement probability and ${percent(forecast.confidencePercentage)} reliability. That is ${money(Math.abs(delta))} ${relation} the ${money(target.amount)} target.`;
  }

  if (includesAny(q, ["cancel", "cancellation", "anulat", "anulare", "anulate"])) {
    return ro
      ? `Rata de anulare este ${percent(sales.cancellationRatePercentage)}: ${number(sales.cancelledContracts)} contracte anulate și ${number(sales.recordedContracts)} contracte înregistrate în perioada curentă.`
      : `The cancellation rate is ${percent(sales.cancellationRatePercentage)}: ${number(sales.cancelledContracts)} cancelled contracts and ${number(sales.recordedContracts)} recorded contracts in the current period.`;
  }

  if (includesAny(q, ["average contract", "avg contract", "valoare medie", "valoarea medie", "ticket mediu"])) {
    return ro
      ? `Valoarea medie a unui contract înregistrat este ${money(sales.averageContractAmount)}, calculată pe ${number(sales.recordedContracts)} contracte.`
      : `Average recorded contract value is ${money(sales.averageContractAmount)} across ${number(sales.recordedContracts)} contracts.`;
  }

  if (includesAny(q, ["growth", "crestere", "scadere", "previous period", "perioada anterioara", "evolutie"])) {
    return ro
      ? `Față de perioada anterioară de aceeași lungime, vânzările s-au modificat cu ${percent(sales.salesGrowthPercentage)}, iar numărul de contracte cu ${percent(sales.contractGrowthPercentage)}.`
      : `Versus the previous equal-length period, recorded sales changed by ${percent(sales.salesGrowthPercentage)} and recorded contracts by ${percent(sales.contractGrowthPercentage)}.`;
  }

  if (includesAny(q, ["why", "de ce", "difference", "different", "diferenta"])
      && includesAny(q, ["leaderboard", "ranking", "advisor", "advisors", "target", "pace"])) {
    const leader = [...stats.advisors].filter((item) => item.rank === 1)[0];
    return ro
      ? `Sunt două procente cu sens diferit. Progresul dealership-ului (${percent(target.achievementPercentage)}) este vânzări realizate / targetul complet al perioadei. În leaderboard, procentul unui advisor este față de targetul așteptat până la data raportării; 100% înseamnă că este exact pe ritmul necesar până azi${leader ? `. De exemplu, ${advisorName(leader)} este la ${percent(leader.achievementPercentage)} din ritmul așteptat până acum.` : "."}`
      : `Those percentages have different meanings. Dealership target progress (${percent(target.achievementPercentage)}) is recorded sales divided by the full-period target. Leaderboard advisor percentages are measured against expected target-to-date; 100% means exactly on the required pace so far${leader ? `. For example, ${advisorName(leader)} is at ${percent(leader.achievementPercentage)} of expected pace to date.` : "."}`;
  }

  if (includesAny(q, ["target", "pace", "goal", "obiectiv", "tinta", "remaining", "ramas", "ritm"])) {
    if (!target.amount) return ro ? "Nu există un target configurat pentru perioada curentă." : "There is no configured dealership target for the current period.";
    const paceRatio = safeNumber(target.requiredAveragePace) > 0
      ? safeNumber(target.currentAveragePace) / safeNumber(target.requiredAveragePace) * 100
      : null;
    const shortfallDaily = safeNumber(target.requiredAveragePace) - safeNumber(target.currentAveragePace);
    return ro
      ? `Ai ${money(target.achieved)} realizat din ${money(target.amount)} (${percent(target.achievementPercentage)}), deci mai sunt ${money(target.remaining)}. Ritmul curent este ${money(target.currentAveragePace)}/zi față de ${money(target.requiredAveragePace)}/zi necesar (${paceRatio === null ? "—" : percent(paceRatio)} din ritmul necesar), cu ${number(target.daysRemaining)} zile rămase${shortfallDaily > 0 ? `; lipsesc aproximativ ${money(shortfallDaily)}/zi ca ritm` : "; ritmul curent este peste cel necesar"}.`
      : `You have ${money(target.achieved)} recorded against a ${money(target.amount)} target (${percent(target.achievementPercentage)}), leaving ${money(target.remaining)}. Current pace is ${money(target.currentAveragePace)}/day versus ${money(target.requiredAveragePace)}/day required (${paceRatio === null ? "—" : percent(paceRatio)} of required pace), with ${number(target.daysRemaining)} days left${shortfallDaily > 0 ? `; the pace gap is about ${money(shortfallDaily)}/day` : "; current pace is above the required pace"}.`;
  }

  if (includesAny(q, ["at risk", "risk", "risc", "sub target", "behind", "in urma", "ramasi in urma"])) {
    if (!stats.atRiskAdvisors.length) return ro ? "Niciun advisor nu este marcat în prezent ca fiind at risk." : "No advisors are currently flagged as at risk.";
    const rows = stats.atRiskAdvisors.slice(0, 8).map((row) => `${row.advisorName} (${money(row.sales)} / ${money(row.target)})`);
    return ro
      ? `${number(stats.atRiskAdvisors.length)} advisors sunt marcați at risk: ${rows.join(" · ")}.`
      : `${number(stats.atRiskAdvisors.length)} advisors are flagged at risk: ${rows.join(" · ")}.`;
  }

  const asksTeamCount = includesAny(q, [
    "how many advisors", "how many agents", "team size", "cati advisori", "cati agenti", "cati consultanti",
    "advisors have sales", "advisors with sales", "agenti au vanzari", "consilieri au vanzari",
    "sales advisors", "service advisors", "advisori sales", "advisori service",
  ]);
  if (asksTeamCount) {
    if (includesAny(q, ["service advisors", "advisori service"])) {
      return ro ? `Sunt ${number(team.serviceAdvisors)} service advisors în echipă.` : `There are ${number(team.serviceAdvisors)} service advisors on the team.`;
    }
    if (includesAny(q, ["sales advisors", "advisori sales"])) {
      return ro ? `Sunt ${number(team.salesAdvisors)} sales advisors în echipă.` : `There are ${number(team.salesAdvisors)} sales advisors on the team.`;
    }
    if (includesAny(q, ["have sales", "with sales", "au vanzari"])) {
      const coverage = safeNumber(team.totalAdvisors) > 0 ? safeNumber(team.advisorsWithSales) / safeNumber(team.totalAdvisors) * 100 : 0;
      return ro
        ? `${number(team.advisorsWithSales)} din ${number(team.totalAdvisors)} advisors au vânzări în perioada curentă (${percent(coverage)}).`
        : `${number(team.advisorsWithSales)} of ${number(team.totalAdvisors)} advisors have recorded sales in the current period (${percent(coverage)}).`;
    }
    return ro ? `Echipa are ${number(team.totalAdvisors)} advisors.` : `The team has ${number(team.totalAdvisors)} advisors.`;
  }

  if (includesAny(q, ["above target", "ahead of target", "peste target", "peste ritm", "below target", "under target", "sub target pace"])) {
    const above = includesAny(q, ["above target", "ahead of target", "peste target", "peste ritm"]);
    const rows = stats.advisors.filter((item) => item.achievementPercentage !== null && item.achievementPercentage !== undefined)
      .filter((item) => above ? safeNumber(item.achievementPercentage) >= 100 : safeNumber(item.achievementPercentage) < 100);
    if (includesAny(q, ["how many", "cati", "cate"])) {
      return ro
        ? `${number(rows.length)} advisors sunt ${above ? "la sau peste" : "sub"} ritmul de target până în prezent.`
        : `${number(rows.length)} advisors are ${above ? "at or above" : "below"} expected target-to-date pace.`;
    }
    return rows.length
      ? rows.slice(0, 8).map((item, index) => `${index + 1}. ${advisorLine(item, "achievement")}`).join("\n")
      : (ro ? "Niciun advisor nu corespunde criteriului în snapshot-ul curent." : "No advisor matches that criterion in the current snapshot.");
  }

  const cohort = includesAny(q, ["service advisor", "service advisors", "advisori service"])
    ? "SERVICE"
    : includesAny(q, ["sales advisor", "sales advisors", "advisori sales"]) ? "SALES" : null;
  if (cohort && (wantsSales(q) || wantsContracts(q))) {
    const rows = stats.advisors.filter((item) => item.advisorType === cohort);
    const cohortSales = rows.reduce((sum, item) => sum + safeNumber(item.sales), 0);
    const cohortContracts = rows.reduce((sum, item) => sum + safeNumber(item.contracts), 0);
    return ro
      ? `${label(cohort)} advisors: ${money(cohortSales)} vânzări din ${number(cohortContracts)} contracte în perioada curentă.`
      : `${label(cohort)} advisors: ${money(cohortSales)} in sales from ${number(cohortContracts)} contracts in the current period.`;
  }

  if (includesAny(q, ["no sales", "zero sales", "fara vanzari", "nu au vandut", "nicio vanzare"])) {
    const rows = stats.advisors.filter((item) => safeNumber(item.sales) === 0);
    return rows.length
      ? rows.slice(0, 10).map((item, index) => `${index + 1}. ${advisorName(item)}${item.advisorType ? ` · ${label(item.advisorType)}` : ""}`).join("\n")
      : (ro ? "Toți advisorii încărcați au vânzări în perioada curentă." : "All loaded advisors have recorded sales in the current period.");
  }

  const requestedTier = ["GOLD", "SILVER", "BRONZE"].find((tier) => q.includes(tier.toLowerCase()));
  if (requestedTier && includesAny(q, ["advisor", "advisors", "agent", "agenti", "cine", "who", "cati", "how many"])) {
    const rows = stats.advisors.filter((item) => item.tier === requestedTier);
    if (includesAny(q, ["how many", "cati", "cate"])) return `${number(rows.length)} advisors are ${label(requestedTier)}.`;
    return rows.length
      ? rows.slice(0, 10).map((item, index) => `${index + 1}. ${advisorName(item)} · rank #${number(item.rank)} · ${percent(item.achievementPercentage)} target pace`).join("\n")
      : `No ${label(requestedTier)} advisors are present in the loaded snapshot.`;
  }

  const advisorDomain = includesAny(q, ["advisor", "advisors", "agent", "agenti", "consultant", "consultanti", "ranking", "rank", "performer", "who", "cine", "a vandut"]);
  if (advisorDomain) {
    const lowest = wantsLowest(q);
    const metric = includesAny(q, ["points", "puncte"]) ? "points" : wantsContracts(q) ? "contracts" : wantsSales(q) ? "sales" : "achievement";
    const getter = metric === "points" ? (item) => item.lifetimeEarnedPoints : metric === "contracts" ? (item) => item.contracts : metric === "sales" ? (item) => item.sales : (item) => item.achievementPercentage;
    let rows = sortedBy(stats.advisors.filter((item) => item.rank !== null || item.sales !== null), getter, lowest);
    if (includesAny(q, ["closest to target", "closest target", "cel mai aproape de target", "cea mai aproape de target"])) {
      rows = [...stats.advisors]
        .filter((item) => item.achievementPercentage !== null && item.achievementPercentage !== undefined)
        .sort((a, b) => Math.abs(100 - safeNumber(a.achievementPercentage)) - Math.abs(100 - safeNumber(b.achievementPercentage)));
    }
    if (metric === "achievement" && !lowest && includesAny(q, ["rank", "ranking", "leaderboard"])) {
      rows = [...stats.advisors].filter((item) => item.rank !== null).sort((a, b) => safeNumber(a.rank, 9999) - safeNumber(b.rank, 9999));
    }
    const ordinal = ordinalOnly(qCurrent);
    if (ordinal) {
      const item = rows[ordinal - 1];
      return item ? advisorLine(item, metric === "achievement" ? "rank" : metric) : (ro ? "Nu există suficiente date pentru acea poziție." : "There is not enough data for that position.");
    }
    const n = extractTopN(q, wantsList(q) ? 3 : 1);
    const selected = rows.slice(0, n);
    if (!selected.length) return ro ? "Nu am date de performanță pentru advisors în snapshot-ul curent." : "Advisor performance data is unavailable in the current snapshot.";
    if (n === 1) return advisorLine(selected[0], metric);
    return selected.map((item, index) => `${index + 1}. ${advisorLine(item, metric)}`).join("\n");
  }

  if (includesAny(q, ["advisor", "team", "echipa", "agenti", "consultanti"])) {
    const coverage = safeNumber(team.totalAdvisors) > 0 ? safeNumber(team.advisorsWithSales) / safeNumber(team.totalAdvisors) * 100 : 0;
    return ro
      ? `Echipa are ${number(team.totalAdvisors)} advisors: ${number(team.salesAdvisors)} sales și ${number(team.serviceAdvisors)} service. ${number(team.advisorsWithSales)} au vânzări în perioada curentă (${percent(coverage)} din echipă).`
      : `The team has ${number(team.totalAdvisors)} advisors: ${number(team.salesAdvisors)} sales and ${number(team.serviceAdvisors)} service advisors. ${number(team.advisorsWithSales)} recorded sales in the current period (${percent(coverage)} of the team).`;
  }

  if (includesAny(q, ["product", "products", "produs", "produse", "best selling", "sell the most", "top product", "cel mai vandut"])) {
    const metric = wantsContracts(q) ? "contracts" : wantsShare(q) ? "share" : "sales";
    const getter = metric === "contracts" ? (item) => item.transactions : metric === "share" ? (item) => item.salesSharePercentage : (item) => item.sales;
    const rows = sortedBy(stats.products, getter, wantsLowest(q));
    const ordinal = ordinalOnly(qCurrent);
    if (ordinal) return rows[ordinal - 1] ? productLine(rows[ordinal - 1], metric) : (ro ? "Nu există suficiente produse în setul curent." : "There are not enough products in the current dataset.");
    const n = extractTopN(q, wantsList(q) ? 3 : 1);
    const selected = rows.slice(0, n);
    if (!selected.length) return ro ? "Nu există date de product performance pentru perioada curentă." : "Product performance data is unavailable for the current period.";
    return n === 1 ? productLine(selected[0], metric) : selected.map((item, index) => `${index + 1}. ${productLine(item, metric)}`).join("\n");
  }

  const dimensionRequest = (terms, items, name) => {
    if (!includesAny(q, terms)) return null;
    const metric = wantsSales(q) ? "sales" : wantsShare(q) ? "share" : "contracts";
    const getter = metric === "sales" ? (item) => item.sales : metric === "share" ? (item) => item.transactionSharePercentage : (item) => item.transactions;
    const rows = sortedBy(items, getter, wantsLowest(q));
    const ordinal = ordinalOnly(qCurrent);
    if (ordinal) return rows[ordinal - 1] ? dimensionLine(rows[ordinal - 1], metric) : `${name} data is insufficient.`;
    const n = extractTopN(q, wantsList(q) ? 3 : 1);
    if (!rows.length) return ro ? `Nu există date pentru ${name} în perioada curentă.` : `There is no ${name} data for the current period.`;
    return n === 1 ? dimensionLine(rows[0], metric) : rows.slice(0, n).map((item, index) => `${index + 1}. ${dimensionLine(item, metric)}`).join("\n");
  };

  const categoryAnswer = dimensionRequest(["category", "categorie", "categorii"], stats.categories, "product category");
  if (categoryAnswer) return categoryAnswer;
  const segmentAnswer = dimensionRequest(["customer segment", "segment", "client", "clienti"], stats.customerSegments, "customer segment");
  if (segmentAnswer) return segmentAnswer;
  const powertrainAnswer = dimensionRequest(["powertrain", "motor", "electric", "diesel", "petrol", "hybrid", "propulsion"], stats.powertrains, "powertrain");
  if (powertrainAnswer) return powertrainAnswer;
  const conditionAnswer = dimensionRequest(["vehicle condition", "new used", "used", "second hand", "nou", "rulat"], stats.vehicleConditions, "vehicle condition");
  if (conditionAnswer) return conditionAnswer;

  if (includesAny(q, ["alert", "alerte", "warning", "warnings", "opportunity", "oportunitate", "unread", "nerezolvate", "unresolved"])) {
    if (!stats.alerts.length) return ro ? "Nu există alerte în snapshot-ul curent." : "There are no alerts in the current snapshot.";
    let alerts = [...stats.alerts];
    if (includesAny(q, ["warning", "warnings", "avertisment"])) alerts = alerts.filter((item) => item.severity === "WARNING");
    if (includesAny(q, ["opportunity", "oportunitate"])) alerts = alerts.filter((item) => item.severity === "OPPORTUNITY" || item.type === "OPPORTUNITY");
    if (includesAny(q, ["unread", "necitite"])) alerts = alerts.filter((item) => !item.read);
    if (includesAny(q, ["unresolved", "nerezolvate", "open", "deschise"])) alerts = alerts.filter((item) => !item.resolved);
    if (!alerts.length) return ro ? "Nu există alerte care să corespundă filtrului cerut." : "No alerts match that filter in the current snapshot.";
    if (!wantsList(q) && !includesAny(q, ["what", "ce", "care"])) {
      return `${number(alerts.length)} alerts match. ${number(stats.alertCounts.unread)} unread · ${number(stats.alertCounts.unresolved)} unresolved.`;
    }
    return alerts.slice(0, 6).map((item, index) => `${index + 1}. [${label(item.severity)}] ${item.title}`).join("\n");
  }

  if (includesAny(q, ["recommend", "recommendation", "what should", "ce sa fac", "ce facem", "actiune", "action", "next step", "urmatorul pas"])) {
    if (!stats.recommendations.length) return ro ? "Nu există recomandări determinate în snapshot-ul curent." : "There are no grounded recommendations in the current snapshot.";
    return stats.recommendations.slice(0, 4).map((item, index) => `${index + 1}. ${item.title}: ${item.action}`).join("\n");
  }

  if (includesAny(q, ["latest sale", "recent sale", "ultima vanzare", "recent activity", "activitate recenta", "largest recent", "cea mai mare vanzare recenta"])) {
    if (!stats.recentSales.length) return ro ? "Nu există sales activity recentă în snapshot." : "There is no recent sales activity in the snapshot.";
    const item = includesAny(q, ["largest", "biggest", "cea mai mare"])
      ? topBy(stats.recentSales, (sale) => sale.amount)
      : [...stats.recentSales].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0];
    return `${money(item.amount)} · ${date(item.date)}${item.productName ? ` · ${item.productName}` : ""}${item.advisorName ? ` · ${item.advisorName}` : ""}.`;
  }

  if (wantsSales(q)) {
    return ro
      ? `Vânzările înregistrate sunt ${money(sales.value)} din ${number(sales.recordedContracts)} contracte pentru ${date(stats.scope.periodStart)} – ${date(stats.scope.periodEnd)}.`
      : `Recorded sales are ${money(sales.value)} from ${number(sales.recordedContracts)} contracts for ${date(stats.scope.periodStart)} – ${date(stats.scope.periodEnd)}.`;
  }

  if (wantsContracts(q)) {
    return ro
      ? `Sunt ${number(sales.recordedContracts)} contracte înregistrate și ${number(sales.cancelledContracts)} anulate în perioada curentă.`
      : `${number(sales.recordedContracts)} contracts were recorded and ${number(sales.cancelledContracts)} were cancelled in the current period.`;
  }

  return ro
    ? "Nu pot lega întrebarea de o statistică verificată din snapshot-ul curent. Poți formula liber, de exemplu: „top 3 agenți după contracte”, „compară Sam cu Morgan”, „care categorie are cele mai mari vânzări?”, „ce alerte sunt nerezolvate?” sau „cât ne mai lipsește din target?”."
    : "I could not map that to a verified statistic in the current snapshot. Try a free-form question such as “top 3 advisors by contracts”, “compare Sam with Morgan”, “which category has the highest sales?”, “what alerts are unresolved?” or “how far are we from target?”.";
}

export function ManagerStatsAssistant({ dashboard }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [lastSource, setLastSource] = useState("LOCAL_FALLBACK");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me naturally about the dealership. I can rank, compare and calculate from verified manager statistics — including data that is not visible on the current screen.",
    },
  ]);
  const input = useRef(null);
  const messagesEnd = useRef(null);

  const data = dashboard?.data;
  const dealershipId = data?.identity?.dealershipId;
  const periodStart = data?.performance?.analytics?.periodStart;
  const reportingDate = data?.performance?.reportingDate;

  const fullLeaderboard = useResource(
    dealershipId && periodStart && reportingDate
      ? query("/api/leaderboard", {
          dealershipId,
          start: periodStart,
          end: reportingDate,
          page: 0,
          size: 100,
        })
      : null,
  );
  const advisorDirectory = useResource(
    dealershipId
      ? query("/api/advisors", { dealershipId, page: 0, size: 100 })
      : null,
  );
  const allAlerts = useResource(data ? query("/api/alerts", { page: 0, size: 100 }) : null);

  const stats = useMemo(
    () => data
      ? buildSnapshot(
          data,
          fullLeaderboard.data?.content || [],
          advisorDirectory.data?.content || [],
          allAlerts.data?.content || [],
        )
      : null,
    [data, fullLeaderboard.data, advisorDirectory.data, allAlerts.data],
  );

  useEffect(() => {
    if (open) messagesEnd.current?.scrollIntoView({ block: "end" });
  }, [messages, pending, open]);

  async function ask(value = question) {
    const trimmed = value.trim();
    if (!trimmed || !stats || pending) return;

    const historyBeforeQuestion = messages.slice(-8);
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setQuestion("");
    setPending(true);

    let responseText = null;
    let source = "LOCAL_FALLBACK";
    try {
      const response = await request("/api/manager-stats/ask", {
        method: "POST",
        body: {
          question: trimmed,
          history: historyBeforeQuestion.map((message) => ({ role: message.role, content: message.text })),
          verifiedStats: stats,
        },
      });
      if (response?.answer) {
        responseText = response.answer;
        source = response.source || "AI_GROUNDED";
      }
    } catch {
      // The external AI layer is optional. The deterministic query engine below remains available.
    }

    if (!responseText) {
      responseText = localAnswer(trimmed, stats, historyBeforeQuestion);
    }

    setLastSource(source);
    setMessages((current) => [...current, { role: "assistant", text: responseText }]);
    setPending(false);
    requestAnimationFrame(() => input.current?.focus());
  }

  return (
    <div className={`stats-assistant ${open ? "open" : ""}`}>
      {open ? (
        <section className="stats-assistant-panel" aria-label="Manager statistics assistant">
          <header className="stats-assistant-header">
            <div className="stats-assistant-title">
              <span className="stats-assistant-icon"><BarChart3 size={18} /></span>
              <div>
                <strong>Stats assistant</strong>
                <span>{lastSource === "AI_GROUNDED" ? "AI reasoning · verified JSON only" : "Smart query · verified JSON"}</span>
              </div>
            </div>
            <button
              type="button"
              className="icon-button stats-assistant-close"
              onClick={() => setOpen(false)}
              aria-label="Minimize statistics assistant"
            >
              <ChevronDown size={18} />
            </button>
          </header>

          <div className="stats-assistant-scope">
            <Database size={13} />
            {stats ? `Actuals through ${date(stats.scope.reportingDate)} · ${number(stats.advisors.length)} advisors loaded` : "Loading manager statistics…"}
          </div>

          <div className="stats-assistant-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`stats-message ${message.role}`}>
                {message.role === "assistant" && <Sparkles size={13} />}
                <span>{message.text}</span>
              </div>
            ))}
            {pending && (
              <div className="stats-message assistant stats-thinking">
                <LoaderCircle size={14} />
                <span>Checking the verified statistics…</span>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {messages.length === 1 && (
            <div className="stats-quick-prompts">
              {quickPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => ask(prompt)} disabled={!stats || pending}>
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form
            className="stats-assistant-form"
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
          >
            <input
              ref={input}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={stats ? "Ask naturally: compare, rank, filter…" : "Loading statistics…"}
              disabled={!stats || pending}
              aria-label="Ask the statistics assistant"
            />
            <button type="submit" className="stats-send" disabled={!stats || pending || !question.trim()} aria-label="Send question">
              {pending ? <LoaderCircle size={16} /> : <Send size={16} />}
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          className="stats-assistant-launcher"
          onClick={() => setOpen(true)}
          aria-label="Open manager statistics assistant"
        >
          <MessageCircle size={18} />
          <span>Ask stats</span>
        </button>
      )}
    </div>
  );
}
