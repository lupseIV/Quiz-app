package com.examprep.note;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "notes")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long courseId;

    private Long topicId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NoteType type;

    @Column(columnDefinition = "text")
    private String textContent;

    /** Base64 data URL of the canvas PNG for DRAWING notes. */
    @Column(columnDefinition = "text")
    private String imageData;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Note() {
    }

    public Note(Long courseId, Long topicId, NoteType type, String textContent, String imageData) {
        this.courseId = courseId;
        this.topicId = topicId;
        this.type = type;
        this.textContent = textContent;
        this.imageData = imageData;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
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

    public NoteType getType() {
        return type;
    }

    public String getTextContent() {
        return textContent;
    }

    public String getImageData() {
        return imageData;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void update(String textContent, String imageData) {
        this.textContent = textContent;
        this.imageData = imageData;
    }
}
