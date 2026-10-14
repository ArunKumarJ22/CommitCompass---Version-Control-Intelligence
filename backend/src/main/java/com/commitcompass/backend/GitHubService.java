
package com.commitcompass.backend;

import tools.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GitHubService {

    private final RestClient restClient;

    public GitHubService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.github.com")
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("User-Agent", "CommitCompass")
                .build();
    }

    public JsonNode getCommits(String owner, String repo) {
        String url = "/repos/{owner}/{repo}/commits?per_page=10";

        return restClient.get()
                .uri(url, owner, repo)
                .retrieve()
                .body(JsonNode.class);
    }
}
