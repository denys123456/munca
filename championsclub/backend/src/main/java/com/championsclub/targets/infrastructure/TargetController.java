package com.championsclub.targets.infrastructure;
import com.championsclub.targets.application.*;
import com.championsclub.common.application.Pages;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/targets")
class TargetController {
    private final TargetService service;
    TargetController(TargetService service) { this.service=service; }
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    TargetStore.TargetData create(@Valid @RequestBody TargetStore.TargetData request) { return service.save(null, request); }
    @GetMapping("/{id}")
    TargetStore.TargetData get(@PathVariable long id) { return service.get(id); }
    @PutMapping("/{id}")
    TargetStore.TargetData update(@PathVariable long id, @Valid @RequestBody TargetStore.TargetData request) { return service.save(id, request); }
    @GetMapping
    Page<TargetStore.TargetData> list(@RequestParam long ownerId, @RequestParam TargetStore.OwnerType ownerType,
                                    @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return service.list(ownerId, ownerType, Pages.of(page, size));
    }
    @GetMapping("/progress")
    TargetService.TargetSnapshot progress(@RequestParam long ownerId, @RequestParam TargetStore.OwnerType ownerType,
                                         @RequestParam(required=false) LocalDate date) {
        return service.progress(ownerId, ownerType, date == null ? LocalDate.now() : date);
    }
}
