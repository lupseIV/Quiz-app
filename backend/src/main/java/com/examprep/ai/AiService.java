package com.examprep.ai;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.examprep.common.AiException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * The single gateway to Anthropic's Claude API. The API key lives only here,
 * server-side — the frontend never talks to Claude directly.
 */
@Service
public class AiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String model;
    private final int maxTokens;

    public AiService(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.ai.base-url:https://api.anthropic.com}") String baseUrl,
            @Value("${app.ai.api-key:}") String apiKey,
            @Value("${app.ai.model:claude-sonnet-5}") String model,
            @Value("${app.ai.max-tokens:4096}") int maxTokens) {
        this.restClient = restClientBuilder
            .baseUrl(baseUrl)
            .defaultHeader("x-api-key", apiKey)
            .defaultHeader("anthropic-version", "2023-06-01")
            .build();
        this.objectMapper = objectMapper;
        this.model = model;
        this.maxTokens = maxTokens;
    }

    /**
     * Sends a single-turn prompt and returns Claude's text reply.
     */
    public String complete(String systemPrompt, String userPrompt) {
        return complete(systemPrompt, List.of(new Message("user", userPrompt)));
    }

    /**
     * Sends a multi-turn conversation and returns Claude's text reply.
     */
    public String complete(String systemPrompt, List<Message> messages) {
        try {
            Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "system", systemPrompt,
                "messages", messages.stream()
                    .map(m -> Map.of("role", m.role(), "content", m.content()))
                    .toList());

            String response = restClient.post()
                .uri("/v1/messages")
                .body(body)
                .retrieve()
                .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            JsonNode content = root.path("content");
            StringBuilder text = new StringBuilder();
            for (JsonNode block : content) {
                if ("text".equals(block.path("type").asString())) {
                    text.append(block.path("text").asString());
                }
            }
            if (text.isEmpty()) {
                throw new AiException("Claude returned an empty response");
            }
            return text.toString();
        } catch (AiException e) {
            throw e;
        } catch (Exception e) {
            throw new AiException("Failed to call Claude API: " + e.getMessage(), e);
        }
    }

    /**
     * Extracts the first JSON object/array from Claude's reply. Claude sometimes wraps
     * JSON in markdown fences or prose, so callers should always go through this instead
     * of parsing the raw reply.
     */
    public JsonNode extractJson(String reply) {
        String trimmed = reply.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline >= 0 && lastFence > firstNewline) {
                trimmed = trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        int objStart = trimmed.indexOf('{');
        int arrStart = trimmed.indexOf('[');
        int start = (arrStart >= 0 && (objStart < 0 || arrStart < objStart)) ? arrStart : objStart;
        if (start < 0) {
            throw new AiException("Claude's response did not contain JSON");
        }
        char open = trimmed.charAt(start);
        char close = open == '{' ? '}' : ']';
        int end = trimmed.lastIndexOf(close);
        if (end <= start) {
            throw new AiException("Claude's response contained malformed JSON");
        }
        try {
            return objectMapper.readTree(trimmed.substring(start, end + 1));
        } catch (Exception e) {
            throw new AiException("Failed to parse JSON from Claude's response", e);
        }
    }

    public record Message(String role, String content) {
    }
}
