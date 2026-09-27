package com.championsclub.ai.infrastructure;

import com.championsclub.ai.application.ManagerStatsChatService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager-stats")
class ManagerStatsChatController {
    private final ManagerStatsChatService service;

    ManagerStatsChatController(ManagerStatsChatService service) {
        this.service = service;
    }

    @PostMapping("/ask")
    @PreAuthorize("hasRole('MANAGER')")
    ManagerStatsChatService.ChatResponse ask(@RequestBody ManagerStatsChatService.ChatRequest request) {
        return service.answer(request);
    }
}
