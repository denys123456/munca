import { useMemo, useState } from "react";
import {
  CarFront,
  CircleDollarSign,
  Package,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import { useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters } from "../lib/useFilters.js";
import { label } from "../lib/format.js";
import {
  Badge,
  Empty,
  Field,
  Modal,
  PageHeader,
  Panel,
  Resource,
} from "../components/ui.jsx";

const categoryMeta = {
  FINANCING: { icon: CircleDollarSign, className: "financing" },
  LEASING: { icon: CarFront, className: "leasing" },
  INSURANCE: { icon: ShieldCheck, className: "insurance" },
  SERVICE: { icon: Wrench, className: "service" },
  OTHER: { icon: Package, className: "other" },
};

function advisorScopeLabel(scope) {
  if (scope === "BOTH") return "Sales & service advisors";
  if (scope === "SALES") return "Sales advisors";
  if (scope === "SERVICE") return "Service advisors";
  return label(scope);
}

function ProductVisual({ category }) {
  const meta = categoryMeta[category] || categoryMeta.OTHER;
  const Icon = meta.icon;
  return (
    <div className={`product-card-visual ${meta.className}`} aria-hidden="true">
      <span className="product-card-orbit orbit-one" />
      <span className="product-card-orbit orbit-two" />
      <div className="product-card-icon">
        <Icon size={30} strokeWidth={1.7} />
      </div>
      <span className="product-card-category">{label(category || "OTHER")}</span>
    </div>
  );
}

export default function Products() {
  const [filters, update] = useFilters({
    search: "",
    category: "",
    scope: "",
    sort: "name",
  });
  const [selected, setSelected] = useState(null);

  // The catalog is intentionally loaded as one compact reference set so that
  // category/scope filters respond immediately instead of filtering one page at a time.
  const resource = useResource(query("/api/products", { page: 0, size: 100 }));

  const filteredProducts = useMemo(() => {
    const rows = resource.data?.content || [];
    const needle = filters.search.trim().toLowerCase();
    const result = rows.filter((row) => {
      const matchesSearch =
        !needle ||
        [row.name, row.code, row.description, label(row.category)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      const matchesCategory = !filters.category || row.category === filters.category;
      const matchesScope =
        !filters.scope ||
        row.advisorScope === filters.scope ||
        row.advisorScope === "BOTH";
      return matchesSearch && matchesCategory && matchesScope;
    });

    return result.sort((a, b) => {
      if (filters.sort === "category") {
        return String(a.category || "").localeCompare(String(b.category || "")) ||
          String(a.name || "").localeCompare(String(b.name || ""));
      }
      if (filters.sort === "code") {
        return String(a.code || "").localeCompare(String(b.code || ""));
      }
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [resource.data, filters.search, filters.category, filters.scope, filters.sort]);

  const hasFilters = Boolean(filters.search || filters.category || filters.scope || filters.sort !== "name");

  return (
    <>
      <PageHeader
        eyebrow="KNOW YOUR PROGRAM"
        title="Product catalog"
        description="Browse the product range, compare categories and quickly see which advisor teams can sell each product."
      />
      <Panel
        title="Browse financial products"
        subtitle="Visual catalog · Filter by category, advisor team or product name"
        className="product-catalog-panel"
      >
        <div className="product-catalog-toolbar">
          <label className="product-search-field">
            <span>Search</span>
            <div className="product-search-control">
              <Search size={17} />
              <input
                value={filters.search}
                onChange={(event) => update({ search: event.target.value })}
                placeholder="Name, code or description…"
                aria-label="Search products"
              />
            </div>
          </label>
          <Field
            label="Category"
            value={filters.category}
            onChange={(event) => update({ category: event.target.value })}
          >
            <option value="">All categories</option>
            <option value="FINANCING">Financing</option>
            <option value="LEASING">Leasing</option>
            <option value="INSURANCE">Insurance</option>
            <option value="SERVICE">Service</option>
            <option value="OTHER">Other</option>
          </Field>
          <Field
            label="Advisor team"
            value={filters.scope}
            onChange={(event) => update({ scope: event.target.value })}
          >
            <option value="">All advisor teams</option>
            <option value="SALES">Sales advisors</option>
            <option value="SERVICE">Service advisors</option>
          </Field>
          <Field
            label="Sort by"
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value })}
          >
            <option value="name">Product name</option>
            <option value="category">Category</option>
            <option value="code">Product code</option>
          </Field>
          {hasFilters && (
            <button
              type="button"
              className="button secondary product-filter-reset"
              onClick={() => update({ search: "", category: "", scope: "", sort: "name" })}
            >
              <SlidersHorizontal size={15} />
              Reset filters
            </button>
          )}
        </div>

        <Resource resource={resource}>
          {(data) => (
            <>
              <div className="product-catalog-summary">
                <span>
                  <strong>{filteredProducts.length}</strong> of {data.totalElements} products shown
                </span>
                {(filters.category || filters.scope) && (
                  <span className="product-filter-context">
                    {filters.category ? label(filters.category) : "All categories"}
                    {filters.scope ? ` · ${advisorScopeLabel(filters.scope)}` : ""}
                  </span>
                )}
              </div>

              {filteredProducts.length ? (
                <div className="product-card-grid">
                  {filteredProducts.map((row) => (
                    <article
                      className="product-card"
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open details for ${row.name}`}
                      onClick={() => setSelected(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelected(row);
                        }
                      }}
                    >
                      <ProductVisual category={row.category} />
                      <div className="product-card-body">
                        <div className="product-card-title-row">
                          <div>
                            <span className="product-code">{row.code}</span>
                            <h3>{row.name}</h3>
                          </div>
                          <Badge tone="neutral">{label(row.category)}</Badge>
                        </div>
                        <p className="product-card-description">
                          {row.description || "Financial product available in the ChampionsClub catalog."}
                        </p>
                        <div className="product-card-meta">
                          <span>
                            <small>Advisor team</small>
                            <strong>{advisorScopeLabel(row.advisorScope)}</strong>
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty
                  title="No products match these filters"
                  description="Try another name, category or advisor team."
                >
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => update({ search: "", category: "", scope: "", sort: "name" })}
                  >
                    Clear filters
                  </button>
                </Empty>
              )}
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
          <div className="product-modal-visual">
            <ProductVisual category={selected.category} />
          </div>
          <p className="confirmation-copy">
            {selected.description || "No additional description is available."}
          </p>
          <dl className="detail-grid">
            <div>
              <dt>Category</dt>
              <dd>{label(selected.category)}</dd>
            </div>
            <div>
              <dt>Advisor team</dt>
              <dd>{advisorScopeLabel(selected.advisorScope)}</dd>
            </div>
          </dl>
          <p className="small muted">
            Point awards depend on the configured point rule, contract value and sale date.
          </p>
        </Modal>
      )}
    </>
  );
}
