package com.championsclub.dealerships.infrastructure;

import com.championsclub.common.application.ResourceNotFoundException;
import com.championsclub.dealerships.application.DealershipRepository;
import com.championsclub.dealerships.domain.Dealership;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
class JdbcDealershipRepository implements DealershipRepository {
    private final JdbcTemplate database;
    private final RowMapper<Dealership> mapper = (result, row) -> Dealership.builder()
            .id(result.getLong("id"))
            .name(result.getString("name"))
            .code(result.getString("code"))
            .city(result.getString("city"))
            .region(result.getString("region"))
            .active(result.getBoolean("active"))
            .build();

    JdbcDealershipRepository(JdbcTemplate database) {
        this.database = database;
    }

    public Dealership get(long id) {
        return database.query("select * from dealerships where id = ?", mapper, id)
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("DEALERSHIP_NOT_FOUND", "Dealership not found."));
    }

    public Dealership save(Dealership dealership) {
        Long id = dealership.id();
        if (id == null) {
            id = database.queryForObject(
                    "insert into dealerships(name, code, city, region, active) values(?, ?, ?, ?, ?) returning id",
                    Long.class,
                    dealership.name(),
                    dealership.code(),
                    dealership.city(),
                    dealership.region(),
                    dealership.active()
            );
        } else {
            get(id);
            database.update(
                    "update dealerships set name=?, code=?, city=?, region=?, active=?, updated_at=now() where id=?",
                    dealership.name(),
                    dealership.code(),
                    dealership.city(),
                    dealership.region(),
                    dealership.active(),
                    id
            );
        }
        return get(id);
    }
}
