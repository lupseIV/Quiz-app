package com.examprep.mindmap;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "mind_maps")
public class MindMap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long courseId;

    private Long topicId;

    @Column(nullable = false)
    private String title;

    /** Structured node/connection/color/catchphrase tree as returned by the AI. */
    @Column(nullable = false, columnDefinition = "text")
    private String nodesJson;

    @Column(nullable = false)
    private Instant createdAt;

    protected MindMap() {
    }

    public MindMap(Long courseId, Long topicId, String title, String nodesJson) {
        this.courseId = courseId;
        this.topicId = topicId;
        this.title = title;
        this.nodesJson = nodesJson;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getCourseId() {
        return courseId;
    }

    public Long getTopicId() {
        return topicId;
    }

    public String getTitle() {
        return title;
    }

    public String getNodesJson() {
        return nodesJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
