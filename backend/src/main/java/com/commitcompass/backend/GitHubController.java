
package com.commitcompass.backend;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.databind.JsonNode;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class GitHubController {

    private final GitHubService gitHubService;

    public GitHubController(GitHubService gitHubService) {
        this.gitHubService = gitHubService;
    }

    @GetMapping("/api/github/ping")
    public String ping() {
        return "GitHubController is working!";
    }

    @GetMapping("/api/github/commits")
    public JsonNode getCommits(
            @RequestParam String owner,
            @RequestParam String repo) {

        return gitHubService.getCommits(owner, repo);
    }
    
}
