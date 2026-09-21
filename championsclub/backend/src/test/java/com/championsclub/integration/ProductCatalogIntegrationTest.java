package com.championsclub.integration;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProductCatalogIntegrationTest extends PostgresIntegrationSupport {
    @Test
    void productCatalogExposesStableApiFields() throws Exception {
        String token = login("jane.doe@championsclub.example");
        var page = call("GET", "/api/products?search=&size=20", token, null, 200);

        assertThat(page.path("content").isArray()).isTrue();
        assertThat(page.path("content").isEmpty()).isFalse();

        var product = page.path("content").get(0);
        assertThat(product.hasNonNull("id")).isTrue();
        assertThat(product.path("name").asText()).isNotBlank();
        assertThat(product.path("code").asText()).isNotBlank();
        assertThat(product.has("description")).isTrue();
        assertThat(product.path("category").asText()).isNotBlank();
        assertThat(product.has("active")).isTrue();
        assertThat(product.has("eligible")).isTrue();
        assertThat(product.path("advisorScope").asText()).isNotBlank();

        var detail = call("GET", "/api/products/" + product.path("id").asLong(), token, null, 200);
        assertThat(detail.path("id").asLong()).isEqualTo(product.path("id").asLong());
        assertThat(detail.path("active").asBoolean()).isEqualTo(product.path("active").asBoolean());
        assertThat(detail.path("eligible").asBoolean()).isEqualTo(product.path("eligible").asBoolean());
    }
}
