import { useState } from "react";
import { ArrowUpRight, Gift, Ticket, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useApi, useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters } from "../lib/useFilters.js";
import { date, label, number } from "../lib/format.js";
import {
  Badge,
  Empty,
  Modal,
  MutationForm,
  PageHeader,
  Pagination,
  Panel,
  Progress,
  Resource,
  SearchForm,
  Table,
} from "../components/ui.jsx";

export default function Rewards({ advisorId, embedded = false }) {
  const { user } = useAuth();
  const { mutate } = useApi();
  const id = advisorId || user.id;
  const [filters, update] = useFilters({ search: "", view: "catalog" });
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const summary = useResource(`/api/points/${id}`);
  const catalog = useResource(
    filters.view === "history"
      ? null
      : query(`/api/rewards/advisor/${id}`, {
          search: filters.search,
          page: filters.page,
          size: 9,
        }),
  );
  const history = useResource(
    filters.view === "history"
      ? query("/api/redemptions", {
          advisorId: id,
          page: filters.page,
          size: 12,
        })
      : null,
  );
  const canAct = user.role === "ADVISOR" && user.id === Number(id);
  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow="RECOGNITION THAT MEANS SOMETHING"
          title="Your work. Your rewards."
          description="Turn your earned points into something to look forward to."
        />
      )}
      <Resource resource={summary}>
        {(data) => (
          <div className="rewards-banner">
            <div>
              <span className="eyebrow">AVAILABLE TO REDEEM</span>
              <strong>
                {number(data.availablePoints)}
                <span>points</span>
              </strong>
              {!embedded && (
                <Link to="/points" className="text-link">
                  View point activity <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
            <div className="tier-overview">
              <Trophy size={28} />
              <div>
                <Badge value={data.gamification.currentLevel} />
                <p>
                  {data.gamification.nextLevel
                    ? `${number(data.gamification.remainingPoints)} points to ${label(data.gamification.nextLevel)}`
                    : "Highest recognition tier achieved"}
                </p>
                <Progress
                  title="Progress to next tier"
                  value={data.gamification.progressPercentage}
                />
                <small>
                  {number(data.lifetimeEarnedPoints)} lifetime earned points
                </small>
              </div>
            </div>
          </div>
        )}
      </Resource>
      <div className="tabs" aria-label="Reward views">
        <button
          className={filters.view !== "history" ? "active" : ""}
          aria-pressed={filters.view !== "history"}
          onClick={() => update({ view: "catalog", page: 0 })}
        >
          Reward catalog
        </button>
        <button
          className={filters.view === "history" ? "active" : ""}
          aria-pressed={filters.view === "history"}
          onClick={() => update({ view: "history", page: 0 })}
        >
          Redemption history
        </button>
      </div>
      {filters.view === "history" ? (
        <Panel
          title="Redemption history"
          subtitle="Confirmed redemptions and issued vouchers"
        >
          <Resource resource={history}>
            {(data) => (
              <>
                <Table
                  rows={data.content}
                  caption="Reward redemptions"
                  emptyTitle="No redemptions yet"
                  emptyDescription="Your confirmed reward redemptions will appear here."
                  columns={[
                    {
                      key: "id",
                      title: "Redemption",
                      render: (row) => `#${row.id} · Reward #${row.rewardId}`,
                    },
                    {
                      key: "redeemedAt",
                      title: "Date",
                      render: (row) => date(row.redeemedAt),
                    },
                    {
                      key: "redeemedPoints",
                      title: "Points spent",
                      numeric: true,
                      render: (row) => number(row.redeemedPoints),
                    },
                    {
                      key: "status",
                      title: "Status",
                      render: (row) => <Badge value={row.status} />,
                    },
                    {
                      key: "voucherCode",
                      title: "Voucher",
                      render: (row) => (
                        <code className="voucher-code">{row.voucherCode}</code>
                      ),
                    },
                  ]}
                />
                <Pagination data={data} onPage={(page) => update({ page })} />
              </>
            )}
          </Resource>
        </Panel>
      ) : (
        <>
          <div className="filter-bar standalone">
            <SearchForm
              label="Search rewards"
              value={filters.search}
              onSearch={(search) => update({ search })}
              placeholder="Find your next reward…"
            />
          </div>
          <Resource resource={catalog}>
            {(data) => (
              <>
                {!data.content.length && (
                  <Empty
                    title="No rewards found"
                    description={
                      filters.search
                        ? "Try a different search."
                        : "Rewards will appear when your program publishes them."
                    }
                  />
                )}
                <div className="reward-grid">
                  {data.content.map(
                    ({ reward, canRedeem, missingPoints }, index) => (
                      <article className="reward-card" key={reward.id}>
                        <div className={`reward-art reward-art-${index % 3}`}>
                          <span className="reward-category">
                            {reward.category}
                          </span>
                          <Gift size={48} strokeWidth={1.1} />
                          <span className="reward-art-word">RECOGNITION</span>
                        </div>
                        <div className="reward-card-body">
                          <h2>{reward.name}</h2>
                          <p>{reward.description}</p>
                          <div className="reward-value">
                            <strong>
                              {number(reward.requiredPoints)}
                              <small>points</small>
                            </strong>
                            <span className="small muted">
                              {reward.stock === null
                                ? "Available on demand"
                                : `${number(reward.stock)} remaining`}
                            </span>
                          </div>
                          {canAct ? (
                            <button
                              className={`button ${canRedeem ? "primary" : ""}`}
                              disabled={!canRedeem}
                              onClick={() => setSelected(reward)}
                            >
                              {!reward.available
                                ? "Currently unavailable"
                                : !canRedeem
                                  ? `${number(missingPoints)} more points needed`
                                  : "Redeem reward"}
                              {canRedeem && <ArrowUpRight size={16} />}
                            </button>
                          ) : (
                            <Badge value={canRedeem ? "AVAILABLE" : "INACTIVE"}>
                              {canRedeem
                                ? "Advisor is eligible"
                                : "Not currently eligible"}
                            </Badge>
                          )}
                        </div>
                      </article>
                    ),
                  )}
                </div>
                <Pagination data={data} onPage={(page) => update({ page })} />
              </>
            )}
          </Resource>
        </>
      )}
      {selected && (
        <Modal
          title="Make it yours"
          description={selected.name}
          onClose={() => setSelected(null)}
        >
          <MutationForm
            submitLabel="Confirm redemption"
            onSubmit={() =>
              mutate(
                "/api/rewards/redemptions",
                {
                  method: "POST",
                  body: { advisorId: user.id, rewardId: selected.id },
                },
                "Reward redeemed. Your voucher is ready.",
              )
            }
            onSuccess={(result) => {
              setSelected(null);
              setReceipt(result);
            }}
          >
            <div className="redemption-confirm">
              <Gift size={32} />
              <h3>{selected.name}</h3>
              <p>
                {number(selected.requiredPoints)} points will be deducted from
                your available balance.
              </p>
              <p className="small muted">
                Your lifetime earned points and recognition tier remain
                unchanged.
              </p>
            </div>
          </MutationForm>
        </Modal>
      )}
      {receipt && (
        <Modal
          title="Your reward is confirmed"
          description="Keep your voucher code for fulfillment."
          onClose={() => setReceipt(null)}
        >
          <div className="redemption-confirm">
            <Ticket size={32} />
            <p>{number(receipt.redeemedPoints)} points redeemed</p>
            <code className="receipt-code">{receipt.voucherCode}</code>
            <button
              className="button primary"
              onClick={() => {
                setReceipt(null);
                update({ view: "history", page: 0 });
              }}
            >
              View redemption history
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
