
package com.commitcompass.backend;

import tools.jackson.databind.JsonNode;

import java.net.http.HttpClient;

import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class GitHubService {

    private final RestClient restClient;

    
    public GitHubService() {
        HttpClient httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();

        JdkClientHttpRequestFactory requestFactory =
                new JdkClientHttpRequestFactory(httpClient);

        this.restClient = RestClient.builder()
                .baseUrl("https://api.github.com")
                .requestFactory(requestFactory)
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("User-Agent", "CommitCompass")
                .build();
    }


    // Fetch the latest 10 commits from a GitHub repository
    public JsonNode getCommits(String owner, String repo) {
        String url = "/repos/{owner}/{repo}/commits?per_page=10";

        try {
            return restClient.get()
                    .uri(url, owner, repo)
                    .retrieve()
                    .body(JsonNode.class);

        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();

            if (status == 404) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "GitHub repository not found. Check the owner and repository names.",
                        ex
                );
            }

            if (status == 403) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "GitHub denied the request. Check repository access or API rate limits.",
                        ex
                );
            }

            if (status == 429) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "GitHub API rate limit reached. Please try again later.",
                        ex
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "GitHub API request failed with status " + status + ".",
                    ex
            );

        } catch (ResourceAccessException ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cannot connect to GitHub. Check your internet connection and try again.",
                    ex
            );
        }
    }

    // Fetch details, changed files, and statistics for one commit
    public JsonNode getCommitDetails(
            String owner, String repo, String sha
    ) {
        String url = "/repos/{owner}/{repo}/commits/{sha}";

        try {
            return restClient.get()
                    .uri(url, owner, repo, sha)
                    .retrieve()
                    .body(JsonNode.class);

        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();

            if (status == 404) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Commit or repository not found.",
                        ex
                );
            }

            if (status == 403) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "GitHub denied the request. Check repository access or API rate limits.",
                        ex
                );
            }

            if (status == 429) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "GitHub API rate limit reached. Please try again later.",
                        ex
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "GitHub API request failed with status " + status + ".",
                    ex
            );

        } catch (ResourceAccessException ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cannot connect to GitHub. Check your internet connection and try again.",
                    ex
            );
        }
    }
    
    // Fetch the latest 10 open pull requests from a GitHub repository
    public JsonNode getPullRequests(String owner, String repo) {
        String url = "/repos/{owner}/{repo}/pulls?state=open&per_page=10";

        try {
            return restClient.get()
                    .uri(url, owner, repo)
                    .retrieve()
                    .body(JsonNode.class);

        } catch (RestClientResponseException ex) {
            int status = ex.getStatusCode().value();

            if (status == 404) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "GitHub repository not found. Check the owner and repository names.",
                        ex
                );
            }

            if (status == 403 || status == 429) {
                throw new ResponseStatusException(
                        status == 403
                                ? HttpStatus.FORBIDDEN
                                : HttpStatus.TOO_MANY_REQUESTS,
                        "GitHub denied the request or the API rate limit was reached.",
                        ex
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "GitHub pull request request failed with status " + status + ".",
                    ex
            );

        } catch (ResourceAccessException ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cannot connect to GitHub. Check your internet connection and try again.",
                    ex
            );
        }
    }

}
