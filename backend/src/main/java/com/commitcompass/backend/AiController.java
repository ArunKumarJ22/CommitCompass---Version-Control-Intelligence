
package com.commitcompass.backend;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:8080",
    "https://commitcompass-frontend.onrender.com"
})
public class AiController {

    private final AiExplanationService aiExplanationService;

    public AiController(AiExplanationService aiExplanationService) {
        this.aiExplanationService = aiExplanationService;
    }

    public record ExplainRequest(String diff) {}

    @PostMapping("/explain")
    public ResponseEntity<Map<String, String>> explain(
            @RequestBody ExplainRequest request) {

        if (request.diff() == null || request.diff().isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "A code diff is required."));
        }

        try {
            String explanation =
                aiExplanationService.explainDiff(request.diff());

            return ResponseEntity.ok(
                Map.of("explanation", explanation)
            );
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", exception.getMessage()));
        }
    }
    
    @PostMapping("/risk-analysis")
    public ResponseEntity<Map<String, String>> analyzeRisk(
            @RequestBody ExplainRequest request) {

        if (request.diff() == null || request.diff().isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "A code diff is required."));
        }

        try {
            String analysis = aiExplanationService.analyzeRisk(request.diff());
            return ResponseEntity.ok(Map.of("analysis", analysis));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", exception.getMessage()));
        }
    }

}
