package com.championsclub.ai.application;

import com.championsclub.security.application.Access;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ManagerStatsChatService {
    private static final int MAX_HISTORY_TURNS = 8;
    private static final int MAX_QUESTION_LENGTH = 700;

    private final AiClient client;
    private final Access access;

    public ManagerStatsChatService(AiClient client, Access access) {
        this.client = client;
        this.access = access;
    }

    public ChatResponse answer(ChatRequest request) {
        access.manager();
        if (request == null || request.question() == null || request.question().isBlank()) {
            throw new IllegalArgumentException("A question is required.");
        }
        String question = request.question().trim();
        if (question.length() > MAX_QUESTION_LENGTH) {
            throw new IllegalArgumentException("The question is too long.");
        }
        if (request.verifiedStats() == null) {
            throw new IllegalArgumentException("Verified manager statistics are required.");
        }

        var history = request.history() == null
                ? List.<AiClient.ChatTurn>of()
                : request.history().stream()
                        .filter(turn -> turn != null && turn.role() != null && turn.content() != null)
                        .filter(turn -> "user".equals(turn.role()) || "assistant".equals(turn.role()))
                        .map(turn -> new AiClient.ChatTurn(
                                turn.role(),
                                turn.content().length() > 1200 ? turn.content().substring(0, 1200) : turn.content()
                        ))
                        .toList();
        if (history.size() > MAX_HISTORY_TURNS) {
            history = history.subList(history.size() - MAX_HISTORY_TURNS, history.size());
        }

        var response = client.answerStats(new AiClient.StatsChatRequest(question, history, request.verifiedStats()));
        if (response.isEmpty() || response.get().answer() == null || response.get().answer().isBlank()) {
            return new ChatResponse(null, "LOCAL_FALLBACK", List.of());
        }
        return new ChatResponse(
                response.get().answer().trim(),
                "AI_GROUNDED",
                response.get().usedFields() == null ? List.of() : response.get().usedFields()
        );
    }

    public record ChatRequest(String question, List<ChatTurn> history, Object verifiedStats) {}

    public record ChatTurn(String role, String content) {}

    public record ChatResponse(String answer, String source, List<String> usedFields) {}
}
