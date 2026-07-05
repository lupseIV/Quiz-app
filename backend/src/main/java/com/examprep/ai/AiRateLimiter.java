package com.examprep.ai;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.examprep.common.RateLimitExceededException;

/**
 * Simple in-memory sliding-window rate limiter for AI endpoints, keyed by user id.
 * Good enough for a single-instance deployment; swap for a Redis-backed limiter
 * if the backend is ever scaled horizontally.
 */
@Component
public class AiRateLimiter {

    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final int maxRequestsPerMinute;
    private final Clock clock;
    private final Map<Long, Deque<Instant>> requests = new ConcurrentHashMap<>();

    @Autowired
    public AiRateLimiter(@Value("${app.ai.requests-per-minute:10}") int maxRequestsPerMinute) {
        this(maxRequestsPerMinute, Clock.systemUTC());
    }

    AiRateLimiter(int maxRequestsPerMinute, Clock clock) {
        this.maxRequestsPerMinute = maxRequestsPerMinute;
        this.clock = clock;
    }

    /** Records one AI request for the user, or throws if the per-minute budget is spent. */
    public void checkAndRecord(Long userId) {
        Deque<Instant> window = requests.computeIfAbsent(userId, id -> new ArrayDeque<>());
        Instant now = clock.instant();
        synchronized (window) {
            Instant cutoff = now.minus(WINDOW);
            while (!window.isEmpty() && window.peekFirst().isBefore(cutoff)) {
                window.pollFirst();
            }
            if (window.size() >= maxRequestsPerMinute) {
                throw new RateLimitExceededException(
                    "AI request limit reached (" + maxRequestsPerMinute + "/minute). Try again shortly.");
            }
            window.addLast(now);
        }
    }
}
