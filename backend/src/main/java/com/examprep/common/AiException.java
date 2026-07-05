package com.examprep.common;

/** Thrown when the Claude API call fails or returns an unparseable response. */
public class AiException extends RuntimeException {
    public AiException(String message) {
        super(message);
    }

    public AiException(String message, Throwable cause) {
        super(message, cause);
    }
}
