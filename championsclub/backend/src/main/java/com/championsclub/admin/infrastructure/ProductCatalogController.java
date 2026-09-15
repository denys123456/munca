package com.championsclub.admin.infrastructure;
import com.championsclub.admin.application.ConfigurationStore;
import com.championsclub.common.application.Pages;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/products")
class ProductCatalogController {
    private final ConfigurationStore products;
    ProductCatalogController(ConfigurationStore products) { this.products=products; }
    @GetMapping
    Page<ConfigurationStore.ProductData> list(@RequestParam(defaultValue="") String search,
                                             @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return products.products(search,Pages.of(page,size));
    }
    @GetMapping("/{id}")
    ConfigurationStore.ProductData get(@PathVariable long id) { return products.product(id); }
}
