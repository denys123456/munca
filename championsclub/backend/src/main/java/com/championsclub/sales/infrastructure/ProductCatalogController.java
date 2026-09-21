package com.championsclub.sales.infrastructure;

import com.championsclub.common.application.Pages;
import com.championsclub.common.application.ResourceNotFoundException;
import com.championsclub.sales.application.FinancialProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
class ProductCatalogController {
    private final FinancialProductRepository products;

    ProductCatalogController(FinancialProductRepository products) {
        this.products = products;
    }

    @GetMapping
    Page<ProductResponse> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return products.search(search, Pages.of(page, size)).map(ProductResponse::from);
    }

    @GetMapping("/{id}")
    ProductResponse get(@PathVariable long id) {
        return products.findById(id)
                .map(ProductResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Financial product not found."));
    }
}
