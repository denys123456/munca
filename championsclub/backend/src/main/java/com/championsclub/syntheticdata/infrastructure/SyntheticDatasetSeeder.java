package com.championsclub.syntheticdata.infrastructure;

import com.championsclub.syntheticdata.application.SyntheticDatasetImporter;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "championsclub.synthetic-data.enabled", havingValue = "true")
class SyntheticDatasetSeeder implements ApplicationRunner {
    private final SyntheticDatasetImporter importer;
    private final Path datasetDirectory;
    private final String password;

    SyntheticDatasetSeeder(
            SyntheticDatasetImporter importer,
            @Value("${championsclub.synthetic-data.directory}") String datasetDirectory,
            @Value("${championsclub.synthetic-data.password}") String password
    ) {
        this.importer = importer;
        this.datasetDirectory = Path.of(datasetDirectory);
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments arguments) {
        importer.importDataset(datasetDirectory, password);
    }
}
