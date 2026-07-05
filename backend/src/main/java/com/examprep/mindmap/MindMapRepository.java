package com.examprep.mindmap;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MindMapRepository extends JpaRepository<MindMap, Long> {
    List<MindMap> findByCourseIdOrderByCreatedAtDesc(Long courseId);
}
