package com.commitcompass.backend;

import tools.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class GitHubController {

    private final GitHubService gitHubService;
    private final CommitPersistenceService commitPersistenceService;

    public GitHubController(
            GitHubService gitHubService,
            CommitPersistenceService commitPersistenceService
    ) {
        this.gitHubService = gitHubService;
        this.commitPersistenceService = commitPersistenceService;
    }

    @GetMapping("/api/github/ping")
    public String ping() {
        return "GitHubController is working!";
    }

    // Fetch commits directly from GitHub
    @GetMapping("/api/github/commits")
    public JsonNode getCommits(
            @RequestParam String owner,
            @RequestParam String repo
    ) {
        return gitHubService.getCommits(owner, repo);
    }

    // Fetch GitHub commits and save new ones in PostgreSQL
    @PostMapping("/api/github/commits/sync")
    public String syncCommits(
            @RequestParam String owner,
            @RequestParam String repo
    ) {
        JsonNode githubCommits = gitHubService.getCommits(owner, repo);

        int savedCount = commitPersistenceService.saveGitHubCommits(
                owner, repo, githubCommits
        );

        return "Sync completed. New commits saved: " + savedCount;
    }

    // Retrieve commits from PostgreSQL
    @GetMapping("/api/github/commits/saved")
    public List<Commit> getSavedCommits(
            @RequestParam String owner,
            @RequestParam String repo
    ) {
        return commitPersistenceService.getSavedCommits(owner, repo);
    }
}
