package com.championsclub.alerts.infrastructure;
import com.championsclub.alerts.application.*;
import com.championsclub.common.application.Pages;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/alerts")
class AlertController {
    private final AlertService service;
    AlertController(AlertService service) { this.service=service; }
    @GetMapping
    Page<AlertStore.AlertData> list(@RequestParam(required=false) Long recipientId,@RequestParam(defaultValue="0") int page,
                                   @RequestParam(defaultValue="20") int size) { return service.list(recipientId,Pages.of(page,size)); }
    @PostMapping("/{id}/read")
    AlertStore.AlertData read(@PathVariable long id) { return service.read(id); }
    @PostMapping("/{id}/resolve")
    AlertStore.AlertData resolve(@PathVariable long id) { return service.resolve(id); }
}
