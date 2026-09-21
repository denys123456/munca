package com.championsclub.syntheticdata.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.function.Consumer;
import org.springframework.stereotype.Component;

@Component
class SyntheticDatasetFiles {
    private final ObjectMapper objectMapper;

    SyntheticDatasetFiles(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    <T> T read(Path path, Class<T> type) {
        try {
            return objectMapper.readValue(path.toFile(), type);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read synthetic dataset file " + path.getFileName() + ".", exception);
        }
    }

    <T> void forEach(Path path, Class<T> type, Consumer<T> consumer) {
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.isBlank()) {
                    consumer.accept(objectMapper.readValue(line, type));
                }
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read synthetic dataset file " + path.getFileName() + ".", exception);
        }
    }
}
