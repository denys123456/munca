import { useState } from "react";
import { useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters } from "../lib/useFilters.js";
import { label } from "../lib/format.js";
import {
  Badge,
  Modal,
  PageHeader,
  Pagination,
  Panel,
  Resource,
  SearchForm,
  Table,
} from "../components/ui.jsx";

export default function Products() {
  const [filters, update] = useFilters({ search: "" });
  const [selected, setSelected] = useState(null);
  const resource = useResource(
    query("/api/products", {
      search: filters.search,
      page: filters.page,
      size: 12,
    }),
  );
  return (
    <>
      <PageHeader
        eyebrow="KNOW YOUR PROGRAM"
        title="Product catalog"
        description="Explore products and advisor eligibility before recording a contract."
      />
      <Panel
        title="Financial products"
        subtitle="Program catalog · Newest first"
      >
        <div className="filter-bar">
          <SearchForm
            label="Search products"
            value={filters.search}
            onSearch={(search) => update({ search })}
            placeholder="Search products…"
          />
        </div>
        <Resource resource={resource}>
          {(data) => (
            <>
              <Table
                rows={data.content}
                caption="Product catalog"
                emptyTitle="No products found"
                emptyDescription="Try another search or contact your program coordinator."
                columns={[
                  {
                    key: "name",
                    title: "Product",
                    render: (row) => (
                      <div className="table-identity">
                        <strong>{row.name}</strong>
                        <small>{row.code}</small>
                      </div>
                    ),
                  },
                  {
                    key: "category",
                    title: "Category",
                    render: (row) => label(row.category),
                  },
                  {
                    key: "advisorScope",
                    title: "Advisor eligibility",
                    render: (row) =>
                      row.advisorScope === "BOTH"
                        ? "Sales & service"
                        : label(row.advisorScope),
                  },
                  {
                    key: "active",
                    title: "Status",
                    render: (row) => (
                      <Badge value={row.active ? "ACTIVE" : "INACTIVE"} />
                    ),
                  },
                  {
                    key: "eligible",
                    title: "Program eligible",
                    render: (row) => (row.eligible ? "Yes" : "No"),
                  },
                  {
                    key: "action",
                    title: "Details",
                    render: (row) => (
                      <button
                        className="text-button"
                        onClick={() => setSelected(row)}
                      >
                        View details
                      </button>
                    ),
                  },
                ]}
              />
              <Pagination data={data} onPage={(page) => update({ page })} />
            </>
          )}
        </Resource>
      </Panel>
      {selected && (
        <Modal
          title={selected.name}
          description={selected.code}
          onClose={() => setSelected(null)}
        >
          <p className="confirmation-copy">
            {selected.description || "No additional description is available."}
          </p>
          <dl className="detail-grid">
            <div>
              <dt>Category</dt>
              <dd>{label(selected.category)}</dd>
            </div>
            <div>
              <dt>Advisor eligibility</dt>
              <dd>
                {selected.advisorScope === "BOTH"
                  ? "Sales & service"
                  : label(selected.advisorScope)}
              </dd>
            </div>
          </dl>
          <p className="small muted">
            Point awards depend on the active point rule, contract value and
            sale date.
          </p>
        </Modal>
      )}
    </>
  );
}
