import { ArrowDownRight, ArrowRight, ArrowUpRight, Crown, Medal, Trophy } from "lucide-react";
import { date, money, number, percent } from "../lib/format.js";

const tierWeight = { GOLD: 3, SILVER: 2, BRONZE: 1 };

function monthYearParts(value) {
  if (!value) return { month: "—", year: "" };
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return { month: "—", year: "" };
  return {
    month: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(parsed),
    year: new Intl.DateTimeFormat("en-GB", { year: "numeric" }).format(parsed),
  };
}

export function RankMomentum({ rank, previousRank }) {
  const delta = previousRank ? previousRank - rank : 0;
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : ArrowRight;
  const tone = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return (
    <span className={`rank-momentum ${tone}`} title={previousRank ? `Previous viewed rank: #${previousRank}` : "No previous snapshot yet"}>
      <Icon size={15} />
      {previousRank ? (delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta}`) : "new"}
    </span>
  );
}


export function TargetPaceMomentum({ achievementPercentage }) {
  if (achievementPercentage === null || achievementPercentage === undefined) {
    return <span className="rank-momentum flat"><ArrowRight size={15} /> no target</span>;
  }
  const achievement = Number(achievementPercentage || 0);
  const ahead = achievement >= 100;
  const Icon = ahead ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`rank-momentum ${ahead ? "up" : "down"}`}
      title={ahead ? "Ahead of target pace" : "Below target pace"}
    >
      <Icon size={15} />
      {ahead ? "ahead" : "below"}
    </span>
  );
}

export function LeaderboardPodium({ rows = [], previousRanks = {}, linkBuilder }) {
  const top = rows.slice(0, 3);
  if (!top.length) return null;
  const ordered = top.length >= 3 ? [top[1], top[0], top[2]] : top;
  return (
    <div className="podium" aria-label="Top three advisors">
      {ordered.map((row) => {
        const position = row.rank;
        const name = row.advisor.advisorName;
        const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("");
        const body = (
          <>
            <span className={`podium-avatar position-${position}`}>{initials}</span>
            <span className="podium-medal" aria-hidden="true">
              {position === 1 ? <Crown size={18} /> : position === 2 ? <Trophy size={17} /> : <Medal size={17} />}
            </span>
            <strong>{name}</strong>
            <span className="podium-score">{percent(row.achievementPercentage)}</span>
            <span className="podium-tier">{row.gamification.currentLevel}</span>
            <TargetPaceMomentum achievementPercentage={row.achievementPercentage} />
            <span className={`podium-block podium-block-${position}`}>#{position}</span>
          </>
        );
        return linkBuilder ? (
          <a className={`podium-person podium-person-${position}`} href={linkBuilder(row)} key={row.advisor.advisorId}>{body}</a>
        ) : (
          <div className={`podium-person podium-person-${position}`} key={row.advisor.advisorId}>{body}</div>
        );
      })}
    </div>
  );
}

export function TargetTrajectory({ points = [], target }) {
  if (!target?.targetId || !points.length) return null;
  const width = 820, height = 270, left = 58, right = 20, top = 24, bottom = 40;
  const parse = (value) => new Date(`${value}T00:00:00`);
  const startDate = parse(target.periodStart || points[0].date);
  const endDate = parse(target.periodEnd || points.at(-1).date);
  const day = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.round((endDate - startDate) / day) + 1);
  const sortedPoints = [...points].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  let cumulative = 0;
  const actual = sortedPoints.map((point) => ({
    date: point.date,
    amount: (cumulative += Number(point.amount || 0)),
  }));
  const targetAmount = Number(target.progress?.targetAmount || target.targetAmount || 0);
  const max = Math.max(targetAmount, ...actual.map((point) => point.amount), 1) * 1.08;
  const xDate = (value) => {
    const dateValue = typeof value === "string" ? parse(value) : value;
    const elapsed = Math.max(0, Math.min(totalDays - 1, Math.round((dateValue - startDate) / day)));
    return left + (elapsed / Math.max(1, totalDays - 1)) * (width - left - right);
  };
  const y = (value) => top + (1 - Number(value || 0) / max) * (height - top - bottom);
  const actualPath = actual
    .map((point, index) => `${index ? "L" : "M"}${xDate(point.date)},${y(point.amount)}`)
    .join(" ");
  const pacePath = `M${xDate(startDate)},${y(0)} L${xDate(endDate)},${y(targetAmount)}`;
  const last = actual.at(-1);
  const lastDate = parse(last.date);
  const elapsedDays = Math.max(1, Math.min(totalDays, Math.round((lastDate - startDate) / day) + 1));
  const expectedToDate = targetAmount * (elapsedDays / totalDays);
  const fullAchievement = targetAmount ? (last.amount / targetAmount) * 100 : 0;
  const paceAchievement = expectedToDate ? (last.amount / expectedToDate) * 100 : 0;
  const paceDelta = paceAchievement - 100;
  const paceAhead = paceDelta >= 0;
  return (
    <div className="trajectory-card">
      <div className="trajectory-metrics">
        <div className="trajectory-metric">
          <span>Total target completed</span>
          <strong>{percent(fullAchievement)}</strong>
          <small>{money(last.amount)} recorded of {money(targetAmount)} target</small>
        </div>
        <div className={`trajectory-metric pace ${paceAhead ? "ahead" : "behind"}`}>
          <span>Pace through {date(last.date)}</span>
          <strong>{percent(paceAchievement)}</strong>
          <small>{money(last.amount)} recorded vs {money(expectedToDate)} expected by now</small>
          <em>{paceAhead ? "+" : ""}{percent(paceDelta)} {paceAhead ? "ahead of" : "behind"} expected pace</em>
        </div>
      </div>
      <div className="trajectory-legend">
        <span><i className="legend-line actual" /> cumulative recorded sales</span>
        <span><i className="legend-line pace" /> required pace to reach the full-period target</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cumulative sales compared with target pace over the configured target period">
        {[0, .25, .5, .75, 1].map((ratio) => (
          <g key={ratio}>
            <line className="chart-grid" x1={left} x2={width-right} y1={y(max*ratio)} y2={y(max*ratio)} />
            <text className="chart-label" x={left-10} y={y(max*ratio)+4} textAnchor="end">{number((max*ratio)/1000, 0)}k</text>
          </g>
        ))}
        <path className="target-pace-path" d={pacePath} />
        <path className="target-actual-path" d={actualPath} />
        {actual.map((point, index) =>
          index % Math.max(1, Math.floor(actual.length / 6)) === 0 || index === actual.length - 1 ? (
            <circle key={point.date} className="target-actual-dot" cx={xDate(point.date)} cy={y(point.amount)} r="4">
              <title>{date(point.date)} · cumulative {money(point.amount)}</title>
            </circle>
          ) : null,
        )}
        <circle className="target-end-dot" cx={xDate(endDate)} cy={y(targetAmount)} r="5">
          <title>Target end · {date(target.periodEnd)} · {money(targetAmount)}</title>
        </circle>
      </svg>
      <div className="trajectory-footer three">
        <span>{date(target.periodStart)}</span>
        <span>Actuals through {date(last.date)}</span>
        <span>{date(target.periodEnd)}</span>
      </div>
    </div>
  );
}

export function TargetHistoryBars({ rows = [] }) {
  if (!rows.length) return <p className="panel-empty">No target history yet.</p>;
  const sorted = [...rows].sort((a, b) => String(a.periodStart).localeCompare(String(b.periodStart)));
  const max = Math.max(...sorted.map((row) => Number(row.targetAmount || 0)), 1);
  return (
    <div className="target-history-bars" aria-label="Target history chart">
      {sorted.map((row) => {
        const height = Math.max(10, (Number(row.targetAmount || 0) / max) * 100);
        return (
          <div className="target-history-bar" key={row.id || `${row.periodStart}-${row.periodEnd}`}>
            <div className="bar-value">{money(row.targetAmount, row.currency)}</div>
            <div className="bar-track"><span style={{ height: `${height}%` }} /></div>
            <strong>{date(row.periodStart)}</strong>
            <small>{date(row.periodEnd)}</small>
          </div>
        );
      })}
    </div>
  );
}

export function ForecastActualHistory({ rows = [] }) {
  const usable = [...rows]
    .filter((row) => row?.actualAchieved !== null && row?.actualAchieved !== undefined)
    .sort((a, b) => String(a.periodStart).localeCompare(String(b.periodStart)));
  if (!usable.length) {
    return <p className="panel-empty">No completed target periods are available yet.</p>;
  }

  const pointGap = 102;
  const height = 286, left = 72, right = 36, top = 28, bottom = 66;
  const plotWidth = Math.max(760, (Math.max(1, usable.length - 1) * pointGap) + 72);
  const width = left + right + plotWidth;
  const allValues = usable.flatMap((row) => [
    Number(row.actualAchieved || 0),
    row.predictedEndValue === null || row.predictedEndValue === undefined
      ? 0
      : Number(row.predictedEndValue || 0),
  ]);
  const max = Math.max(...allValues, 1) * 1.12;
  const x = (i) => left + 30 + (i * pointGap);
  const y = (value) => top + (1 - Number(value || 0) / max) * (height - top - bottom);
  const actualPath = usable
    .map((row, i) => `${i ? "L" : "M"}${x(i)},${y(row.actualAchieved)}`)
    .join(" ");
  const predicted = usable
    .map((row, i) => ({ ...row, index: i }))
    .filter((row) => row.predictedEndValue !== null && row.predictedEndValue !== undefined);
  const predictedPath = predicted
    .map((row, index) => `${index ? "L" : "M"}${x(row.index)},${y(row.predictedEndValue)}`)
    .join(" ");

  return (
    <div className="forecast-actual-history" aria-label="Historical machine-learning forecast compared with final recorded sales">
      <div className="forecast-actual-legend">
        <span><i className="forecast-history-key predicted" /> Predicted period end</span>
        <span><i className="forecast-history-key actual" /> Final recorded sales</span>
        <span className="chart-scroll-hint">Scroll horizontally to explore every period →</span>
      </div>
      <div className="history-chart-scroll" tabIndex={0} role="region" aria-label="Scrollable forecast and actual history chart">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: `${width}px`, minWidth: `${width}px` }}
          role="img"
          aria-label="Predicted and actual sales by completed target period"
        >
          {[0, .25, .5, .75, 1].map((ratio) => (
            <g key={ratio}>
              <line className="chart-grid" x1={left} x2={width-right} y1={y(max*ratio)} y2={y(max*ratio)} />
              <text className="chart-label" x={left-10} y={y(max*ratio)+4} textAnchor="end">
                {number((max*ratio)/1000, 0)}k
              </text>
            </g>
          ))}
          {predicted.length > 1 && <path className="forecast-history-path predicted" d={predictedPath} />}
          <path className="forecast-history-path actual" d={actualPath} />
          {usable.map((row, i) => {
            const labelParts = monthYearParts(row.periodStart);
            return (
              <g key={row.targetId || `${row.periodStart}-${row.periodEnd}`}>
                {row.predictedEndValue !== null && row.predictedEndValue !== undefined && (
                  <circle className="forecast-history-dot predicted" cx={x(i)} cy={y(row.predictedEndValue)} r="5">
                    <title>
                      {date(row.periodStart)} · predicted {money(row.predictedEndValue)} · {row.predictionSource === "ML" ? "ML backtest" : "pace fallback"} using data through {date(row.predictionAsOf)}
                    </title>
                  </circle>
                )}
                <circle className="forecast-history-dot actual" cx={x(i)} cy={y(row.actualAchieved)} r="5">
                  <title>{date(row.periodStart)} · final recorded sales {money(row.actualAchieved)}</title>
                </circle>
                <text className="chart-label chart-period-label" x={x(i)} y={height-30} textAnchor="middle">
                  <tspan x={x(i)}>{labelParts.month}</tspan>
                  <tspan x={x(i)} dy="13">{labelParts.year}</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="forecast-history-note">
        <span>Each prediction is reconstructed at day 14 using only information available up to that checkpoint.</span>
        {usable.some((row) => row.predictionSource !== "ML") && <span>Model-unavailable periods use a clearly identified pace fallback.</span>}
      </div>
    </div>
  );
}

export function TargetHistoryLine({ rows = [] }) {
  if (!rows.length) return <p className="panel-empty">No target history yet.</p>;
  const sorted = [...rows].sort((a, b) => String(a.periodStart).localeCompare(String(b.periodStart)));
  const pointGap = 110;
  const height = 262, left = 66, right = 34, top = 24, bottom = 62;
  const plotWidth = Math.max(720, (Math.max(1, sorted.length - 1) * pointGap) + 70);
  const width = left + right + plotWidth;
  const values = sorted.map((row) => Number(row.targetAmount || 0));
  const max = Math.max(...values, 1) * 1.12;
  const x = (i) => left + 32 + (i * pointGap);
  const y = (v) => top + (1 - Number(v || 0) / max) * (height - top - bottom);
  const path = sorted.map((row, i) => `${i ? "L" : "M"}${x(i)},${y(row.targetAmount)}`).join(" ");
  return (
    <div className="target-history-line" aria-label="Target values over time">
      <div className="history-chart-scroll" tabIndex={0} role="region" aria-label="Scrollable target value history chart">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: `${width}px`, minWidth: `${width}px` }}
          role="img"
          aria-label="Target value history over time"
        >
          {[0, .25, .5, .75, 1].map((ratio) => (
            <g key={ratio}>
              <line className="chart-grid" x1={left} x2={width-right} y1={y(max*ratio)} y2={y(max*ratio)} />
              <text className="chart-label" x={left-10} y={y(max*ratio)+4} textAnchor="end">{number((max*ratio)/1000, 0)}k</text>
            </g>
          ))}
          <path className="target-history-line-path" d={path} />
          {sorted.map((row, i) => {
            const labelParts = monthYearParts(row.periodStart);
            return (
              <g key={row.id || `${row.periodStart}-${row.periodEnd}`}>
                <circle className="target-history-line-dot" cx={x(i)} cy={y(row.targetAmount)} r="5">
                  <title>{date(row.periodStart)} – {date(row.periodEnd)} · {money(row.targetAmount, row.currency)}</title>
                </circle>
                <text className="chart-label chart-period-label" x={x(i)} y={height-28} textAnchor="middle">
                  <tspan x={x(i)}>{labelParts.month}</tspan>
                  <tspan x={x(i)} dy="13">{labelParts.year}</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="trajectory-footer">
        <span>← Earlier targets · scroll horizontally</span>
        <span>{sorted.length} period{sorted.length === 1 ? "" : "s"} · latest configured period →</span>
      </div>
    </div>
  );
}

export function sortLeaderboard(rows, mode) {
  const copy = [...rows];
  if (mode === "level") return copy.sort((a,b) => (tierWeight[b.gamification.currentLevel] || 0) - (tierWeight[a.gamification.currentLevel] || 0) || a.rank - b.rank);
  if (mode === "achievement") return copy.sort((a,b) => Number(b.achievementPercentage || 0) - Number(a.achievementPercentage || 0));
  return copy.sort((a,b) => a.rank - b.rank);
}
