package com.championsclub.points.infrastructure;
import com.championsclub.points.application.*;
import com.championsclub.common.application.Pages;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/points")
class PointsController {
    private final PointService service;
    PointsController(PointService service) { this.service=service; }
    @GetMapping("/{advisorId}")
    PointService.PointSummary summary(@PathVariable long advisorId) { return service.summary(advisorId); }
    @GetMapping("/{advisorId}/transactions")
    Page<PointQueries.Transaction> history(@PathVariable long advisorId,@RequestParam(defaultValue="0") int page,
                                           @RequestParam(defaultValue="20") int size) { return service.history(advisorId,Pages.of(page,size)); }
    @PostMapping("/{advisorId}/adjustments")
    PointService.PointSummary adjust(@PathVariable long advisorId,@Valid @RequestBody Adjustment request) {
        return service.adjust(advisorId,request.amount(),request.reason());
    }
    record Adjustment(int amount,@NotBlank @Size(max=280) String reason) {}
}
