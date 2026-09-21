import { useId, useState } from "react";
import { line, area } from "d3-shape";
import { money, number, shortDate } from "../lib/format.js";
import { Empty, Table } from "./ui.jsx";

export function TrendChart({
  points = [],
  forecast = false,
  title = "Recorded contract value",
  compact = false,
}) {
  const gradient = useId();
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(false);
  if (!points.length)
    return (
      <Empty
        title="No data for this period"
        description="Choose a different reporting period to explore performance."
      />
    );
  const width = 760,
    height = compact ? 190 : 245,
    left = 64,
    right = 20,
    top = 25,
    bottom = 35;
  const max =
    Math.max(1, ...points.map((point) => Number(point.amount))) * 1.15;
  const x = (index) =>
    left +
    (points.length === 1 ? 0.5 : index / (points.length - 1)) *
      (width - left - right);
  const y = (amount) =>
    height - bottom - (Number(amount) / max) * (height - top - bottom);
  const path = line()
    .x((point, index) => x(index))
    .y((point) => y(point.amount))(points);
  const fill = area()
    .x((point, index) => x(index))
    .y0(height - bottom)
    .y1((point) => y(point.amount))(points);
  const shown =
    selected === null ? null : points[Math.min(selected, points.length - 1)];
  const ticks = [
    ...new Set([
      0,
      Math.floor((points.length - 1) / 3),
      Math.floor(((points.length - 1) * 2) / 3),
      points.length - 1,
    ]),
  ];
  return (
    <div className="trend-chart">
      <div className="chart-legend">
        <span>
          <i className={forecast ? "forecast-dot" : ""} />
          {title} · EUR
        </span>
        <span className="chart-inspection" aria-live="polite">
          {shown
            ? `${shortDate(shown.date)} · ${money(shown.amount)}`
            : "Hover or focus to inspect"}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title}, ${shortDate(points[0].date)} to ${shortDate(points.at(-1).date)}. Exact values in the data table.`}
      >
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b67cb" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#3b67cb" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((index) => {
          const amount = (max * index) / 3;
          return (
            <g key={index}>
              <line
                x1={left}
                x2={width - right}
                y1={y(amount)}
                y2={y(amount)}
                className="chart-grid"
              />
              <text
                x={left - 12}
                y={y(amount) + 4}
                textAnchor="end"
                className="chart-label"
              >
                {amount >= 1000
                  ? `${number(amount / 1000, 1)}k`
                  : number(amount)}
              </text>
            </g>
          );
        })}
        {!forecast && <path d={fill} fill={`url(#${gradient})`} />}
        <path
          d={path}
          fill="none"
          stroke={forecast ? "#907443" : "#3563c8"}
          strokeWidth="2.4"
          strokeDasharray={forecast ? "6 5" : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {ticks.map((index) => (
          <text
            key={index}
            x={x(index)}
            y={height - 9}
            textAnchor="middle"
            className="chart-label"
          >
            {shortDate(points[index].date)}
          </text>
        ))}
        {points.map((point, index) => (
          <circle
            key={point.date}
            cx={x(index)}
            cy={y(point.amount)}
            r={selected === index ? 5 : 4}
            fill={selected === index ? "#3563c8" : "transparent"}
            stroke={selected === index ? "white" : "transparent"}
            strokeWidth="2"
            tabIndex={0}
            role="graphics-symbol"
            aria-label={`${shortDate(point.date)}: ${money(point.amount)}`}
            onMouseEnter={() => setSelected(index)}
            onFocus={() => setSelected(index)}
            onBlur={() => setSelected(null)}
            onMouseLeave={() => setSelected(null)}
          >
            <title>
              {shortDate(point.date)}: {money(point.amount)}
            </title>
          </circle>
        ))}
      </svg>
      <button
        className="text-button chart-data-toggle"
        onClick={() => setDetails((value) => !value)}
        aria-expanded={details}
      >
        {details ? "Hide data table" : "View data table"}
      </button>
      {details && (
        <Table
          caption={title}
          rows={points}
          rowKey="date"
          columns={[
            {
              key: "date",
              title: "Date",
              render: (point) => shortDate(point.date),
            },
            {
              key: "amount",
              title: forecast
                ? "Predicted value (EUR)"
                : "Recorded value (EUR)",
              numeric: true,
              render: (point) => money(point.amount),
            },
          ]}
        />
      )}
    </div>
  );
}
