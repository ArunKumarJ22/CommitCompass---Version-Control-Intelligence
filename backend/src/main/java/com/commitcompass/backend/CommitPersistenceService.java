
package com.commitcompass.backend;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import tools.jackson.databind.JsonNode;

@Service
public class CommitPersistenceService {

    private final CommitRepository commitRepository;

    public CommitPersistenceService(CommitRepository commitRepository) {
        this.commitRepository = commitRepository;
    }

    @Transactional
    public int saveGitHubCommits(String owner, String repo, JsonNode githubCommits) {

        List<Commit> newCommits = new ArrayList<>();

        for (JsonNode item : githubCommits) {

            String sha = item.path("sha").asText("");

            if (sha.isBlank() || commitRepository.findBySha(sha).isPresent()) {
                continue;
            }

            JsonNode commitDetails = item.path("commit");

            Commit commit = new Commit();
            commit.setSha(sha);
            commit.setRepositoryOwner(owner);
            commit.setRepositoryName(repo);
            commit.setAuthorName(
                    commitDetails.path("author").path("name").asText("Unknown")
            );
            commit.setMessage(
                    commitDetails.path("message").asText("")
            );
            commit.setHtmlUrl(item.path("html_url").asText(""));

            String date = commitDetails.path("author").path("date").asText("");

            if (!date.isBlank()) {
                commit.setCommitDate(OffsetDateTime.ofInstant(
                        Instant.parse(date),
                        java.time.ZoneOffset.UTC
                ));
            }

            newCommits.add(commit);
        }

        commitRepository.saveAll(newCommits);

        return newCommits.size();
    }

    public List<Commit> getSavedCommits(String owner, String repo) {
        return commitRepository.findByRepositoryOwnerAndRepositoryName(owner, repo);
    }
}
