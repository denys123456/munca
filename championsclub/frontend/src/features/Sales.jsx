import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useApi, useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters } from "../lib/useFilters.js";
import {
  date,
  fullName,
  label,
  localDate,
  money,
  number,
} from "../lib/format.js";
import {
  Badge,
  Field,
  Modal,
  MutationForm,
  PageHeader,
  Pagination,
  Panel,
  Resource,
  Table,
} from "../components/ui.jsx";
import { Lookup } from "../components/Lookup.jsx";

function ProductName({ id }) {
  const product = useResource(`/api/products/${id}`);
  return product.data?.name || `Product #${id}`;
}

function SaleEditor({ advisor, onClose }) {
  const { user } = useAuth();
  const { mutate } = useApi();
  const [selectedAdvisor, setAdvisor] = useState(
    advisor || (user.role === "ADVISOR" ? user : null),
  );
  const [product, setProduct] = useState(null);
  async function save(values) {
    if (!selectedAdvisor)
      throw new Error("Choose an advisor before recording this sale.");
    if (!product)
      throw new Error("Choose an eligible product before recording this sale.");
    return mutate(
      "/api/sales",
      {
        method: "POST",
        body: {
          advisorId: selectedAdvisor.id,
          dealershipId: selectedAdvisor.dealershipId,
          productId: product.id,
          contractAmount: Number(values.get("contractAmount")),
          saleDate: values.get("saleDate"),
          externalReference: values.get("externalReference").trim(),
          currency: "EUR",
        },
      },
      "Sale recorded. Performance and points have been updated.",
    );
  }
  return (
    <Modal
      title="Record a sale"
      description="Record a completed contract. Points are calculated by your program’s rules."
      onClose={onClose}
    >
      <MutationForm
        onSubmit={save}
        onSuccess={onClose}
        submitLabel="Record sale"
      >
        {user.role === "MANAGER" && !advisor ? (
          <Lookup
            title="Advisor"
            path="/api/advisors"
            name="advisorId"
            value={selectedAdvisor}
            onChange={(value) => {
              setAdvisor(value);
              setProduct(null);
            }}
            describe={(item) =>
              `${fullName(item)} · ${label(item.advisorType)}`
            }
            eligible={(item) => item.active}
          />
        ) : (
          <div className="form-context">
            Advisor: <strong>{fullName(selectedAdvisor)}</strong>
          </div>
        )}
        <Lookup
          title="Product"
          path="/api/products"
          name="productId"
          value={product}
          onChange={setProduct}
          describe={(item) => item.name}
          eligible={(item) =>
            item.active &&
            item.eligible &&
            Boolean(selectedAdvisor) &&
            (item.advisorScope === "BOTH" ||
              item.advisorScope === selectedAdvisor?.advisorType)
          }
        />
        <div className="form-grid">
          <Field
            label="Contract value (EUR)"
            name="contractAmount"
            type="number"
            required
            min="0.01"
            max="999999999999.99"
            step="0.01"
            placeholder="0.00"
          />
          <Field
            label="Sale date"
            name="saleDate"
            type="date"
            required
            defaultValue={localDate()}
            max={localDate()}
          />
        </div>
        <Field
          label="External reference"
          name="externalReference"
          required
          maxLength={160}
          placeholder="Contract or transaction reference"
          hint="Use a unique reference from your source system."
        />
      </MutationForm>
    </Modal>
  );
}

export default function Sales({ advisor, embedded = false }) {
  const { user } = useAuth();
  const { mutate } = useApi();
  const [filters, update] = useFilters({ status: "", from: "", to: "" });
  const [create, setCreate] = useState(filters.create === "true");
  const [cancel, setCancel] = useState(null);
  const resource = useResource(
    query("/api/sales", {
      advisorId: advisor?.id || (user.role === "ADVISOR" ? user.id : undefined),
      dealershipId: user.dealershipId,
      status: filters.status,
      from: filters.from,
      to: filters.to,
      page: filters.page,
      size: 12,
    }),
  );
  const openCreate = () => setCreate(true);
  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow="YOUR ACTIVITY, ACCOUNTED FOR"
          title="Sales activity"
          description="Recorded contracts, original point awards and cancellations."
        >
          <button className="button primary" onClick={openCreate}>
            <Plus size={16} />
            Record a sale
          </button>
        </PageHeader>
      )}
      <Panel
        title={embedded ? "Advisor sales history" : "Sales history"}
        subtitle="Newest records first · Values in EUR"
        action={
          embedded && (
            <button className="button small" onClick={openCreate}>
              <Plus size={15} />
              Record sale
            </button>
          )
        }
      >
        <form
          className="filter-bar"
          onSubmit={(event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            update({
              status: values.get("status"),
              from: values.get("from"),
              to: values.get("to"),
            });
          }}
          key={`${filters.status}-${filters.from}-${filters.to}`}
        >
          <Field label="Status" name="status" defaultValue={filters.status}>
            <option value="">All statuses</option>
            <option value="RECORDED">Recorded</option>
            <option value="CANCELLED">Cancelled</option>
          </Field>
          <Field
            label="From"
            name="from"
            type="date"
            defaultValue={filters.from}
          />
          <Field label="To" name="to" type="date" defaultValue={filters.to} />
          <button className="button" type="submit">
            Apply filters
          </button>
          {(filters.status || filters.from || filters.to) && (
            <button
              type="button"
              className="text-button"
              onClick={() => update({ status: "", from: "", to: "" })}
            >
              Clear filters
            </button>
          )}
        </form>
        <Resource resource={resource}>
          {(data) => (
            <>
              <Table
                caption="Sales history"
                rows={data.content}
                emptyTitle={
                  filters.status || filters.from || filters.to
                    ? "No sales match these filters"
                    : "Your sales story starts here"
                }
                emptyDescription="Record a completed sale or adjust the filters to see more activity."
                columns={[
                  {
                    key: "externalReference",
                    title: "Reference",
                    render: (row) => (
                      <div className="table-identity">
                        <strong>{row.externalReference}</strong>
                        <small>Contract #{row.id}</small>
                      </div>
                    ),
                  },
                  {
                    key: "productId",
                    title: "Product",
                    render: (row) => <ProductName id={row.productId} />,
                  },
                  {
                    key: "saleDate",
                    title: "Sale date",
                    render: (row) => date(row.saleDate),
                  },
                  {
                    key: "status",
                    title: "Status",
                    render: (row) => <Badge value={row.status} />,
                  },
                  {
                    key: "awardedPoints",
                    title: "Original award",
                    numeric: true,
                    render: (row) => `${number(row.awardedPoints)} pts`,
                  },
                  {
                    key: "contractAmount",
                    title: "Value",
                    numeric: true,
                    render: (row) => money(row.contractAmount, row.currency),
                  },
                  {
                    key: "actions",
                    title: "Action",
                    render: (row) =>
                      row.status === "RECORDED" ? (
                        <button
                          className="text-button danger-text"
                          onClick={() => setCancel(row)}
                        >
                          Cancel sale
                        </button>
                      ) : (
                        <span className="small muted">
                          {date(row.cancelledAt)}
                        </span>
                      ),
                  },
                ]}
              />
              <Pagination data={data} onPage={(page) => update({ page })} />
            </>
          )}
        </Resource>
      </Panel>
      {create && (
        <SaleEditor
          advisor={advisor}
          onClose={() => {
            setCreate(false);
            if (filters.create) update({ create: "" });
          }}
        />
      )}
      {cancel && (
        <Modal
          title="Cancel this sale?"
          description={`Reference ${cancel.externalReference} · ${money(cancel.contractAmount)}`}
          onClose={() => setCancel(null)}
        >
          <MutationForm
            submitLabel="Confirm cancellation"
            danger
            onSubmit={() =>
              mutate(
                `/api/sales/${cancel.id}/cancel`,
                { method: "POST" },
                "Sale cancelled and the original point award reversed.",
              )
            }
            onSuccess={() => setCancel(null)}
          >
            <p className="confirmation-copy">
              This will remove the contract from recorded sales and reverse its
              original point award. The sale remains in your history. A reversal
              may leave a negative available point balance if points have
              already been redeemed.
            </p>
          </MutationForm>
        </Modal>
      )}
    </>
  );
}
