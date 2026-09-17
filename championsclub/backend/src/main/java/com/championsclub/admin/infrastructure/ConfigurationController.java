package com.championsclub.admin.infrastructure;
import com.championsclub.admin.application.*;
import com.championsclub.admin.application.ConfigurationStore.*;
import com.championsclub.common.application.Pages;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
class ConfigurationController {
    private final ConfigurationCommands commands;
    private final ConfigurationStore queries;
    ConfigurationController(ConfigurationCommands commands, ConfigurationStore queries) {
        this.commands = commands; this.queries = queries;
    }
    @GetMapping("/dealerships")
    Page<DealershipData> dealerships(@RequestParam(defaultValue="") String search, @RequestParam(defaultValue="0") int page,
                                    @RequestParam(defaultValue="20") int size) { return queries.dealerships(search, Pages.of(page, size)); }
    @GetMapping("/dealerships/{id}")
    DealershipData dealership(@PathVariable long id) { return queries.dealership(id); }
    @PostMapping("/dealerships")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    DealershipData createDealership(@Valid @RequestBody DealershipData d) { return commands.dealership(null, d); }
    @PutMapping("/dealerships/{id}")
    DealershipData updateDealership(@PathVariable long id, @Valid @RequestBody DealershipData d) { return commands.dealership(id, d); }
    @GetMapping("/products")
    Page<ProductData> products(@RequestParam(defaultValue="") String search, @RequestParam(defaultValue="0") int page,
                              @RequestParam(defaultValue="20") int size) { return queries.products(search, Pages.of(page, size)); }
    @GetMapping("/products/{id}")
    ProductData product(@PathVariable long id) { return queries.product(id); }
    @PostMapping("/products")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    ProductData createProduct(@Valid @RequestBody ProductData d) { return commands.product(null, d); }
    @PutMapping("/products/{id}")
    ProductData updateProduct(@PathVariable long id, @Valid @RequestBody ProductData d) { return commands.product(id, d); }
    @GetMapping("/rewards")
    Page<RewardData> rewards(@RequestParam(defaultValue="") String search, @RequestParam(defaultValue="0") int page,
                            @RequestParam(defaultValue="20") int size) { return queries.rewards(search, Pages.of(page, size)); }
    @GetMapping("/rewards/{id}")
    RewardData reward(@PathVariable long id) { return queries.reward(id, false); }
    @PostMapping("/rewards")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    RewardData createReward(@Valid @RequestBody RewardData d) { return commands.reward(null, d); }
    @PutMapping("/rewards/{id}")
    RewardData updateReward(@PathVariable long id, @Valid @RequestBody RewardData d) { return commands.reward(id, d); }
    @GetMapping("/point-rules")
    Page<RuleData> rules(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return queries.rules(Pages.of(page, size));
    }
    @GetMapping("/point-rules/{id}")
    RuleData rule(@PathVariable long id) { return queries.rule(id); }
    @PostMapping("/point-rules")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    RuleData createRule(@Valid @RequestBody RuleData d) { return commands.rule(null, d); }
    @PutMapping("/point-rules/{id}")
    RuleData updateRule(@PathVariable long id, @Valid @RequestBody RuleData d) { return commands.rule(id, d); }
    @GetMapping("/gamification")
    Thresholds thresholds() { return queries.thresholds(); }
    @PutMapping("/gamification")
    Thresholds thresholds(@Valid @RequestBody Thresholds d) { return commands.thresholds(d); }
}
