package com.championsclub.syntheticdata.application;

import com.championsclub.points.domain.PointRule;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SyntheticDatasetImporter {
    private final JdbcTemplate database;
    private final PasswordEncoder passwordEncoder;
    private final SyntheticDatasetFiles files;
    private final SyntheticReferenceDataImporter referenceData;
    private final SyntheticConfigurationImporter configuration;
    private final SyntheticSalesImporter sales;
    private final SyntheticRedemptionImporter redemptions;

    public SyntheticDatasetImporter(
            JdbcTemplate database,
            PasswordEncoder passwordEncoder,
            SyntheticDatasetFiles files,
            SyntheticReferenceDataImporter referenceData,
            SyntheticConfigurationImporter configuration,
            SyntheticSalesImporter sales,
            SyntheticRedemptionImporter redemptions
    ) {
        this.database = database;
        this.passwordEncoder = passwordEncoder;
        this.files = files;
        this.referenceData = referenceData;
        this.configuration = configuration;
        this.sales = sales;
        this.redemptions = redemptions;
    }

    @Transactional
    public void importDataset(Path directory, String password) {
        requireDataset(directory);
        requirePassword(password);
        database.execute("select pg_advisory_xact_lock(724316)");

        DatasetManifest manifest = files.read(directory.resolve("dataset_manifest.json"), DatasetManifest.class);
        if (datasetAlreadyLoaded(manifest)) {
            return;
        }
        requireEmptyDatabase();

        referenceData.importDealerships(directory, manifest);
        Map<Long, UserRow> users = referenceData.importUsers(
                directory,
                manifest,
                passwordEncoder.encode(password)
        );
        Map<Long, ProductRow> products = referenceData.importProducts(directory, manifest);
        Map<Long, List<PointRule>> pointRules = configuration.importPointRules(directory);
        configuration.importGamification(directory, manifest);
        Map<Long, RewardRow> rewards = referenceData.importRewards(directory, manifest);
        sales.importSales(directory, users, products, pointRules);
        configuration.importTargets(directory);
        redemptions.importRedemptions(directory, rewards);
        recordDatasetRun(manifest);
        resetSequences();
    }

    private void requireDataset(Path directory) {
        if (!Files.isDirectory(directory) || !Files.isRegularFile(directory.resolve("dataset_manifest.json"))) {
            throw new IllegalStateException("Synthetic dataset files are missing from " + directory + ".");
        }
    }

    private void requirePassword(String password) {
        int passwordBytes = password == null ? 0 : password.getBytes(StandardCharsets.UTF_8).length;
        if (passwordBytes < 12 || passwordBytes > 72) {
            throw new IllegalStateException("Synthetic data password must contain between 12 and 72 UTF-8 bytes.");
        }
    }

    private boolean datasetAlreadyLoaded(DatasetManifest manifest) {
        Integer count = database.queryForObject(
                "select count(*) from synthetic_dataset_runs where id = ?",
                Integer.class,
                UUID.fromString(manifest.runId())
        );
        return count != null && count > 0;
    }

    private void requireEmptyDatabase() {
        Long userCount = database.queryForObject("select count(*) from users", Long.class);
        Long saleCount = database.queryForObject("select count(*) from sales", Long.class);
        if ((userCount != null && userCount > 0) || (saleCount != null && saleCount > 0)) {
            throw new IllegalStateException(
                    "Synthetic dataset loading requires an empty application database. Reset the local database volume before loading."
            );
        }
    }

    private void recordDatasetRun(DatasetManifest manifest) {
        database.update(
                """
                insert into synthetic_dataset_runs(
                    id, seed, generated_at, period_start, period_end, dealership_count, advisor_count,
                    contract_count, calibration_version, source_manifest
                ) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)
                """,
                UUID.fromString(manifest.runId()),
                manifest.seed(),
                Timestamp.from(manifest.generatedAt()),
                manifest.periodStart(),
                manifest.periodEnd(),
                manifest.dealershipCount(),
                manifest.advisorCount(),
                manifest.contractCount(),
                manifest.calibrationVersion(),
                manifest.sourceManifest().toString()
        );
    }

    private void resetSequences() {
        for (String table : List.of(
                "dealerships",
                "users",
                "financial_products",
                "point_rules",
                "sales",
                "targets",
                "rewards",
                "reward_redemptions",
                "point_transactions"
        )) {
            database.execute(
                    "select setval(pg_get_serial_sequence('" + table + "', 'id'), "
                            + "coalesce((select max(id) from " + table + "), 1), true)"
            );
        }
    }
}
