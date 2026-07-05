package com.examprep.mindmap;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.examprep.ai.AiRateLimiter;
import com.examprep.ai.AiService;
import com.examprep.common.AiException;
import com.examprep.common.NotFoundException;
import com.examprep.course.Course;
import com.examprep.course.CourseService;
import com.examprep.mindmap.dto.MindMapDtos.MindMapResponse;
import com.examprep.topic.Topic;
import com.examprep.topic.TopicRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class MindMapService {

    private static final String SYSTEM_PROMPT = """
        You create visual mind-maps for students who learn best through structure and \
        associations. Respond with a single JSON object and nothing else — no prose, no \
        markdown fences. Shape: {"title": string, "root": Node} where Node = {"label": \
        short string, "catchphrase": a vivid, memorable one-liner or mnemonic that makes \
        the fact stick, "color": a hex color (siblings share a hue family, each main \
        branch gets its own distinct hue), "children": Node[]}. Use 3-6 main branches, \
        each 1-3 levels deep. Catchphrases must be suggestive and fun, not dry labels.""";

    private final MindMapRepository mindMapRepository;
    private final TopicRepository topicRepository;
    private final CourseService courseService;
    private final AiService aiService;
    private final AiRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;

    public MindMapService(MindMapRepository mindMapRepository, TopicRepository topicRepository,
            CourseService courseService, AiService aiService, AiRateLimiter rateLimiter,
            ObjectMapper objectMapper) {
        this.mindMapRepository = mindMapRepository;
        this.topicRepository = topicRepository;
        this.courseService = courseService;
        this.aiService = aiService;
        this.rateLimiter = rateLimiter;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MindMapResponse generate(Long userId, Long courseId, Long topicId) {
        Course course = courseService.getOwned(userId, courseId);
        String material = buildMaterial(courseId, topicId);
        if (material.isBlank()) {
            throw new IllegalArgumentException(
                "Add topic content before generating a mind-map");
        }
        rateLimiter.checkAndRecord(userId);

        String userPrompt = "Create a mind-map for the course \"" + course.getName()
            + "\" from this material:\n\n" + material;
        JsonNode json = aiService.extractJson(aiService.complete(SYSTEM_PROMPT, userPrompt));
        validate(json);

        MindMap saved = mindMapRepository.save(new MindMap(
            courseId, topicId, json.path("title").asString(course.getName()), json.toString()));
        return MindMapResponse.from(saved, json);
    }

    public List<MindMapResponse> list(Long userId, Long courseId) {
        courseService.getOwned(userId, courseId);
        return mindMapRepository.findByCourseIdOrderByCreatedAtDesc(courseId).stream()
            .map(map -> MindMapResponse.from(map, readJson(map.getNodesJson())))
            .toList();
    }

    public void delete(Long userId, Long mindMapId) {
        MindMap map = mindMapRepository.findById(mindMapId)
            .orElseThrow(() -> new NotFoundException("Mind-map " + mindMapId + " not found"));
        courseService.getOwned(userId, map.getCourseId());
        mindMapRepository.delete(map);
    }

    private String buildMaterial(Long courseId, Long topicId) {
        List<Topic> topics = topicRepository.findByCourseIdOrderByIdAsc(courseId);
        StringBuilder sb = new StringBuilder();
        for (Topic topic : topics) {
            if (topicId != null && !topic.getId().equals(topicId)) {
                continue;
            }
            if (topic.getContent() != null && !topic.getContent().isBlank()) {
                sb.append("## ").append(topic.getTitle()).append('\n')
                  .append(topic.getContent()).append("\n\n");
            }
        }
        return sb.toString();
    }

    private void validate(JsonNode json) {
        JsonNode root = json.path("root");
        if (root.isMissingNode() || root.path("label").asString("").isBlank()) {
            throw new AiException("Claude returned a malformed mind-map");
        }
    }

    private JsonNode readJson(String nodesJson) {
        try {
            return objectMapper.readTree(nodesJson);
        } catch (Exception e) {
            throw new IllegalStateException("Stored mind-map JSON is unreadable", e);
        }
    }
}
