package com.examprep;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
// Spring Boot 4: MockMvc test support moved to the spring-boot-webmvc-test module
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import tools.jackson.databind.ObjectMapper;

/**
 * End-to-end controller tests against the real Spring context with an in-memory H2
 * database: register -> login -> course CRUD -> topic creation, plus auth rejections.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthAndCourseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void unauthenticatedRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/api/courses"))
            .andExpect(status().isForbidden());
    }

    @Test
    void registerValidationRejectsBadEmailAndShortPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"not-an-email\", \"name\": \"X\", \"password\": \"short\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fields.email").exists())
            .andExpect(jsonPath("$.fields.password").exists());
    }

    @Test
    void fullAuthAndCourseFlow() throws Exception {
        // Register and grab the JWT
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"student@example.com\", \"name\": \"Student\", "
                    + "\"password\": \"password123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andReturn();
        String token = objectMapper.readTree(registerResult.getResponse().getContentAsString())
            .get("token").asString();

        // Duplicate registration is rejected
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"student@example.com\", \"name\": \"Student\", "
                    + "\"password\": \"password123\"}"))
            .andExpect(status().isBadRequest());

        // Login works
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"student@example.com\", \"password\": \"password123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty());

        // Wrong password is a 401
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"student@example.com\", \"password\": \"wrong-password\"}"))
            .andExpect(status().isUnauthorized());

        // Create a course
        MvcResult courseResult = mockMvc.perform(post("/api/courses")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"Linear Algebra\", \"examDate\": \"2026-08-20\", "
                    + "\"description\": \"Vectors and matrices\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Linear Algebra"))
            .andReturn();
        long courseId = objectMapper.readTree(courseResult.getResponse().getContentAsString())
            .get("id").asLong();

        // List shows it
        mockMvc.perform(get("/api/courses").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Linear Algebra"));

        // Add a topic
        mockMvc.perform(post("/api/courses/" + courseId + "/topics")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"Eigenvalues\", \"content\": \"Av = lambda v\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("Eigenvalues"));

        // A second user cannot see or delete the first user's course
        MvcResult otherResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"other@example.com\", \"name\": \"Other\", "
                    + "\"password\": \"password123\"}"))
            .andExpect(status().isOk())
            .andReturn();
        String otherToken = objectMapper.readTree(otherResult.getResponse().getContentAsString())
            .get("token").asString();

        mockMvc.perform(get("/api/courses/" + courseId)
                .header("Authorization", "Bearer " + otherToken))
            .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/courses/" + courseId)
                .header("Authorization", "Bearer " + otherToken))
            .andExpect(status().isNotFound());

        // Owner can delete
        mockMvc.perform(delete("/api/courses/" + courseId)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());
    }
}
