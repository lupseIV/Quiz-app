package com.examprep.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import com.examprep.common.AiException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

class AiServiceExtractJsonTest {

    private AiService aiService;

    @BeforeEach
    void setUp() {
        aiService = new AiService(RestClient.builder(), new ObjectMapper(),
            "https://example.invalid", "key", "model", 1024);
    }

    @Test
    void extractsPlainJsonArray() {
        JsonNode node = aiService.extractJson("[{\"question\": \"Q1\"}]");
        assertThat(node.isArray()).isTrue();
        assertThat(node.get(0).get("question").asString()).isEqualTo("Q1");
    }

    @Test
    void stripsMarkdownFences() {
        JsonNode node = aiService.extractJson("```json\n{\"title\": \"Map\"}\n```");
        assertThat(node.get("title").asString()).isEqualTo("Map");
    }

    @Test
    void extractsJsonSurroundedByProse() {
        JsonNode node = aiService.extractJson(
            "Here is your quiz:\n[{\"question\": \"Q\"}]\nGood luck!");
        assertThat(node.isArray()).isTrue();
    }

    @Test
    void throwsWhenNoJsonPresent() {
        assertThatThrownBy(() -> aiService.extractJson("Sorry, I cannot do that."))
            .isInstanceOf(AiException.class);
    }
}
