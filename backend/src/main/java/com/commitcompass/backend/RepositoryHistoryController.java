
package com.commitcompass.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/repositories/history")
@CrossOrigin(origins = "http://localhost:5173")
public class RepositoryHistoryController {

    private final RepositoryHistoryService historyService;

    public RepositoryHistoryController(
            RepositoryHistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    public ResponseEntity<List<RepositoryHistory>> getHistory() {
        return ResponseEntity.ok(
                historyService.getRecentHistory()
        );
    }

    @PostMapping
    public ResponseEntity<?> recordExploration(
            @RequestParam String owner,
            @RequestParam String repo) {

        if (owner.isBlank() || repo.isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Owner and repository names must not be blank.");
        }

        return ResponseEntity.ok(
                historyService.recordExploration(owner, repo)
        );
    }
}
