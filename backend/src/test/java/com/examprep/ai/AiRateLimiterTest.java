package com.examprep.ai;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import com.examprep.common.RateLimitExceededException;

class AiRateLimiterTest {

    @Test
    void allowsRequestsWithinLimit() {
        AiRateLimiter limiter = new AiRateLimiter(3, Clock.systemUTC());
        assertThatCode(() -> {
            limiter.checkAndRecord(1L);
            limiter.checkAndRecord(1L);
            limiter.checkAndRecord(1L);
        }).doesNotThrowAnyException();
    }

    @Test
    void rejectsRequestsOverLimit() {
        AiRateLimiter limiter = new AiRateLimiter(2, Clock.systemUTC());
        limiter.checkAndRecord(1L);
        limiter.checkAndRecord(1L);
        assertThatThrownBy(() -> limiter.checkAndRecord(1L))
            .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void limitIsPerUser() {
        AiRateLimiter limiter = new AiRateLimiter(1, Clock.systemUTC());
        limiter.checkAndRecord(1L);
        assertThatCode(() -> limiter.checkAndRecord(2L)).doesNotThrowAnyException();
    }

    @Test
    void windowSlidesAfterAMinute() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T10:00:00Z"));
        AiRateLimiter limiter = new AiRateLimiter(1, clock);
        limiter.checkAndRecord(1L);
        clock.advance(Duration.ofSeconds(61));
        assertThatCode(() -> limiter.checkAndRecord(1L)).doesNotThrowAnyException();
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }
    }
}
