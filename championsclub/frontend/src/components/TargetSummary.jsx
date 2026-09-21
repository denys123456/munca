import { Link } from "react-router-dom";
import { ArrowUpRight, Target } from "lucide-react";
import { date, money, number, percent } from "../lib/format.js";
import { Badge, Empty, Progress } from "./ui.jsx";

export function TargetSummary({ target, link = true }) {
  if (!target?.targetId)
    return (
      <Empty
        title="A fresh goal starts here"
        description="No target is configured for this reporting date."
      >
        {link && (
          <Link className="text-link" to="/targets">
            View targets <ArrowUpRight size={14} />
          </Link>
        )}
      </Empty>
    );
  const progress = target.progress;
  return (
    <div className="target-summary">
      <div className="target-summary-top">
        <span className="icon-tile">
          <Target size={20} />
        </span>
        <Badge value={progress.status} />
      </div>
      <p className="eyebrow">TARGET ACHIEVEMENT</p>
      <div className="target-number">
        {percent(progress.achievementPercentage)}
      </div>
      <p className="target-total">
        {money(progress.achievedAmount)}{" "}
        <span>of {money(progress.targetAmount)}</span>
      </p>
      <Progress
        value={progress.achievementPercentage}
        title="Target achievement"
      />
      <div className="target-facts">
        <div>
          <span>Remaining</span>
          <strong>{money(progress.remainingAmount)}</strong>
        </div>
        <div>
          <span>Days left</span>
          <strong>{number(progress.daysRemaining)}</strong>
        </div>
      </div>
      <p className="small muted">
        {date(target.periodStart)} – {date(target.periodEnd)}
      </p>
      {link && (
        <Link className="text-link" to="/targets">
          Explore your targets <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
  );
}
