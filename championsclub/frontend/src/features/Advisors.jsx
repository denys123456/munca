import { Link } from "react-router-dom";
import { ArrowUpRight, Users } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters } from "../lib/useFilters.js";
import { fullName, initials, label } from "../lib/format.js";
import {
  Badge,
  PageHeader,
  Pagination,
  Panel,
  Resource,
  SearchForm,
  Table,
} from "../components/ui.jsx";

export default function Advisors() {
  const { user } = useAuth();
  const [filters, update] = useFilters({ search: "" });
  const resource = useResource(
    query("/api/advisors", {
      dealershipId: user.dealershipId,
      search: filters.search,
      page: filters.page,
      size: 12,
    }),
  );
  return (
    <>
      <PageHeader
        eyebrow="GREAT RESULTS START WITH PEOPLE"
        title="Your team"
        description="Know your advisors. Understand their progress. Help them take the next step."
      >
        <Link className="button" to="/leaderboard">
          <Users size={16} />
          Compare performance
        </Link>
      </PageHeader>
      <Panel
        title="Advisor directory"
        subtitle="Your dealership · Newest accounts first"
      >
        <div className="filter-bar">
          <SearchForm
            label="Search advisors"
            value={filters.search}
            onSearch={(search) => update({ search })}
            placeholder="Search by name or email…"
          />
        </div>
        <Resource resource={resource}>
          {(data) => (
            <>
              <Table
                rows={data.content}
                caption="Advisor directory"
                emptyTitle="No advisors found"
                emptyDescription={
                  filters.search
                    ? "Try another name or email address."
                    : "Advisors assigned to your dealership will appear here."
                }
                columns={[
                  {
                    key: "name",
                    title: "Advisor",
                    render: (row) => (
                      <Link to={`/advisors/${row.id}`} className="table-person">
                        <span className="avatar neutral-avatar">
                          {initials(row)}
                        </span>
                        <span>
                          <strong>{fullName(row)}</strong>
                          <small>{row.email}</small>
                        </span>
                      </Link>
                    ),
                  },
                  {
                    key: "advisorType",
                    title: "Specialism",
                    render: (row) => `${label(row.advisorType)} advisor`,
                  },
                  {
                    key: "active",
                    title: "Status",
                    render: (row) => (
                      <Badge value={row.active ? "ACTIVE" : "INACTIVE"} />
                    ),
                  },
                  {
                    key: "actions",
                    title: "Profile",
                    render: (row) => (
                      <Link className="text-link" to={`/advisors/${row.id}`}>
                        View advisor <ArrowUpRight size={15} />
                      </Link>
                    ),
                  },
                ]}
              />
              <Pagination data={data} onPage={(page) => update({ page })} />
            </>
          )}
        </Resource>
      </Panel>
    </>
  );
}
