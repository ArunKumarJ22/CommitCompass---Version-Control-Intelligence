package com.commitcompass.backend;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class RegressionInvestigationService {

    private final CommitRepository commitRepository;
    private final GitHubService gitHubService;

    public RegressionInvestigationService(
            CommitRepository commitRepository,
            GitHubService gitHubService
    ) {
        this.commitRepository = commitRepository;
        this.gitHubService = gitHubService;
    }
    private int countFileMentions(
        String commitMessage,
        Set<String> changedFileNames
) {
    if (commitMessage == null || commitMessage.isBlank()) {
        return 0;
    }

    int matches = 0;

    for (String fileName : changedFileNames) {
        if (!fileName.isBlank()
                && commitMessage.toLowerCase().contains(
                        fileName.toLowerCase())) {
            matches++;
        }
    }

    return matches;
}

    public Map<String, Object> investigate(
            String owner,
            String repo,
            int pullNumber
    ) {
        JsonNode pullRequests =
                gitHubService.getPullRequests(owner, repo);

        JsonNode selectedPullRequest = null;

        for (JsonNode pullRequest : pullRequests) {
            if (pullRequest.path("number").asInt() == pullNumber) {
                selectedPullRequest = pullRequest;
                break;
            }
        }

        if (selectedPullRequest == null) {
            throw new IllegalArgumentException(
                    "Open pull request not found in the latest results."
            );
        }

        String headSha = selectedPullRequest
                .path("head")
                .path("sha")
                .asText("");

        JsonNode checks =
                gitHubService.getPullRequestChecks(owner, repo, headSha);

        JsonNode changedFiles =
                gitHubService.getPullRequestFiles(owner, repo, pullNumber);

                Set<String> pullRequestFilePaths = new HashSet<>();
                for (JsonNode file : changedFiles) {
                    String path = file.path("filename").asText("");

                    if (!path.isBlank()) {
                        pullRequestFilePaths.add(path);
                    }
                }

        Set<String> changedFileNames = new HashSet<>(); 
        for (JsonNode file : changedFiles) {
            String fileName = file.path("filename").asText("");
            if (!fileName.isBlank()) {
                 changedFileNames.add(fileName);
                 }
            }

        List<Commit> recentCommits =
                commitRepository
                        .findByRepositoryOwnerAndRepositoryNameOrderByCommitDateDesc(
                                owner, repo
                        );

        List<Map<String, Object>> candidates = new ArrayList<>();

      

for (Commit commit : recentCommits) {
    Map<String, Object> candidate = new LinkedHashMap<>();

Set<String> overlappingFiles = new HashSet<>();
boolean fileInspectionError = false;

try {
    JsonNode commitDetails = gitHubService.getCommitDetails(
            owner,
            repo,
            commit.getSha()
    );

    JsonNode commitFiles = commitDetails.path("files");

    if (!commitFiles.isArray()) {
        fileInspectionError = true;
    } else {
        for (JsonNode file : commitFiles) {
            String filePath = file.path("filename").asText("");

            if (!filePath.isBlank()
                    && pullRequestFilePaths.contains(filePath)) {
                overlappingFiles.add(filePath);
            }
        }
    }
} catch (Exception e) {
    fileInspectionError = true;
}

candidate.put("sha", commit.getSha());
candidate.put("message", commit.getMessage());
candidate.put("author", commit.getAuthorName());
candidate.put("commitDate", commit.getCommitDate());
candidate.put("htmlUrl", commit.getHtmlUrl());

candidate.put("fileInspectionError", fileInspectionError);
candidate.put("fileOverlapCount", overlappingFiles.size());
candidate.put("overlappingFiles", new ArrayList<>(overlappingFiles));

String rankingExplanation;

if (fileInspectionError) {
    rankingExplanation =
            "Commit file details could not be inspected. Its overlap score is incomplete.";
} else if (overlappingFiles.isEmpty()) {
    rankingExplanation =
            "Commit inspected successfully; no changed file paths overlap with the pull request.";
} else {
    rankingExplanation =
            "This commit and the pull request both change "
                    + overlappingFiles.size()
                    + " of the same file(s).";
}

candidate.put("rankingExplanation", rankingExplanation);
candidate.put(
        "note",
        "Candidate only. File overlap does not prove that this commit caused a regression."
);

candidates.add(candidate);
}

candidates.sort(
        Comparator.comparingInt(
                (Map<String, Object> candidate) ->
                        (Integer) candidate.get("fileOverlapCount")
        ).reversed()
);
        List<Map<String, Object>> checkResults = new ArrayList<>();

        JsonNode checkRuns = checks.path("check_runs");

        for (JsonNode check : checkRuns) {
            Map<String, Object> result = new LinkedHashMap<>();

            result.put("name", check.path("name").asText("Unknown"));
            result.put("status", check.path("status").asText("unknown"));
            result.put(
                    "conclusion",
                    check.path("conclusion").isNull()
                            ? null
                            : check.path("conclusion").asText()
            );
            result.put("detailsUrl", check.path("html_url").asText(""));

            checkResults.add(result);
        }

        Map<String, Object> report = new LinkedHashMap<>();

        report.put("repository", owner + "/" + repo);
        report.put("pullNumber", pullNumber);
        report.put("headSha", headSha);
        report.put("checks", checkResults);
        report.put("changedFiles", changedFiles);
        report.put("candidateCommits", candidates);
        report.put(
                "limitations",
                List.of(
                        "Candidates are ranked by changed-file overlap, which is a heuristic and does not prove causation.",
                        "Only commits already saved in PostgreSQL are included.",
                        "Failed checks do not prove that a particular commit caused a regression."
                )
        );

        return report;
    }
}
