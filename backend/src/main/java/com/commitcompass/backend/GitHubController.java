
        package com.commitcompass.backend;

        import tools.jackson.databind.JsonNode;

        import org.springframework.http.HttpStatus;
        import org.springframework.http.ResponseEntity;
        import org.springframework.web.bind.annotation.CrossOrigin;
        import org.springframework.web.bind.annotation.GetMapping;
        import org.springframework.web.bind.annotation.PathVariable;
        import org.springframework.web.bind.annotation.PostMapping;
        import org.springframework.web.bind.annotation.RequestParam;
        import org.springframework.web.bind.annotation.RestController;
        import org.springframework.web.server.ResponseStatusException;

        import java.util.List;



        @RestController
        @CrossOrigin(origins = {
                "http://localhost:5173",
                "http://localhost:8080",
                "https://commitcompass-frontend.onrender.com"
                })
        public class GitHubController {

           private final GitHubService gitHubService;
           private final CommitPersistenceService commitPersistenceService;
           private final RegressionInvestigationService regressionInvestigationService;

        public GitHubController(
            GitHubService gitHubService,
            CommitPersistenceService commitPersistenceService,
            RegressionInvestigationService regressionInvestigationService
    ) {
        this.gitHubService = gitHubService;
        this.commitPersistenceService = commitPersistenceService;
        this.regressionInvestigationService = regressionInvestigationService;
    }

        @GetMapping("/api/github/ping")
        public String ping() {
                return "GitHubController is working!";
        }

        // Fetch commits directly from GitHub
        @GetMapping("/api/github/commits")
        public ResponseEntity<?> getCommits(
                @RequestParam String owner,
                @RequestParam String repo
        ) {
                if (hasInvalidInput(owner, repo)) {
                return ResponseEntity.badRequest()
                        .body("Owner and repository names must not be blank.");
                }

                JsonNode commits = gitHubService.getCommits(owner, repo);
                return ResponseEntity.ok(commits);
        }

        // Fetch details for one specific commit
        @GetMapping("/api/github/commits/details")
        public ResponseEntity<?> getCommitDetails(
                @RequestParam String owner,
                @RequestParam String repo,
                @RequestParam String sha
        ) {
                if (hasInvalidInput(owner, repo)
                        || sha == null
                        || sha.isBlank()) {
                return ResponseEntity.badRequest()
                        .body("Owner, repository, and commit SHA must not be blank.");
                }

                JsonNode details =
                        gitHubService.getCommitDetails(owner, repo, sha);

                return ResponseEntity.ok(details);
        }

        
        // Fetch open pull requests from GitHub
        @GetMapping("/api/github/pulls")
        public ResponseEntity<?> getPullRequests(
                @RequestParam String owner,
                @RequestParam String repo
        ) {
                if (hasInvalidInput(owner, repo)) {
                return ResponseEntity.badRequest()
                        .body("Owner and repository names must not be blank.");
                }

                JsonNode pullRequests =
                        gitHubService.getPullRequests(owner, repo);

                return ResponseEntity.ok(pullRequests);
        }
        
                @GetMapping("/api/github/pulls/{pullNumber}/files")
                public JsonNode getPullRequestFiles(
                        @RequestParam String owner,
                        @RequestParam String repo,
                        @PathVariable int pullNumber
                ) {
                if (owner.isBlank() || repo.isBlank() || pullNumber < 1) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Owner, repository, and a valid pull request number are required."
                        );
                }

                return gitHubService.getPullRequestFiles(owner, repo, pullNumber);
                }


        // Fetch CI check runs for a pull request's latest commit
        @GetMapping("/api/github/pulls/{pullNumber}/checks")
        public JsonNode getPullRequestChecks(
                @RequestParam String owner,
                @RequestParam String repo,
                @PathVariable int pullNumber
        ) {
                if (hasInvalidInput(owner, repo) || pullNumber < 1) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Owner, repository, and a valid pull request number are required."
                );
                }

                // Get the pull request to find its latest commit SHA
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
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Open pull request not found."
                );
                }

                String headSha = selectedPullRequest
                        .path("head")
                        .path("sha")
                        .asText("");

                if (headSha.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Could not retrieve the pull request's head commit SHA."
                );
                }

                return gitHubService.getPullRequestChecks(
                        owner, repo, headSha
                );
        }


        // Fetch GitHub commits and save new ones in PostgreSQL
        @PostMapping("/api/github/commits/sync")
        public ResponseEntity<?> syncCommits(
                @RequestParam String owner,
                @RequestParam String repo
        ) {
                if (hasInvalidInput(owner, repo)) {
                return ResponseEntity.badRequest()
                        .body("Owner and repository names must not be blank.");
                }

                JsonNode githubCommits = gitHubService.getCommits(owner, repo);

                int savedCount = commitPersistenceService.saveGitHubCommits(
                        owner, repo, githubCommits
                );

                return ResponseEntity.ok(
                        "Sync completed. New commits saved: " + savedCount
                );
        }

        // Retrieve commits from PostgreSQL
        @GetMapping("/api/github/commits/saved")
        public ResponseEntity<?> getSavedCommits(
                @RequestParam String owner,
                @RequestParam String repo
        ) {
                if (hasInvalidInput(owner, repo)) {
                return ResponseEntity.badRequest()
                        .body("Owner and repository names must not be blank.");
                }

                List<Commit> commits =
                        commitPersistenceService.getSavedCommits(owner, repo);

                return ResponseEntity.ok(commits);
        }

        // Validate repository input in one place
        private boolean hasInvalidInput(String owner, String repo) {
                return owner == null
                        || owner.isBlank()
                        || repo == null
                        || repo.isBlank();
        }

        
        @GetMapping("/api/github/regression/investigate")
        public ResponseEntity<?> investigateRegression(
                @RequestParam String owner,
                @RequestParam String repo,
                @RequestParam int pullNumber
        ) {
        if (hasInvalidInput(owner, repo) || pullNumber < 1) {
                return ResponseEntity.badRequest().body(
                        "Owner, repository, and a valid pull request number are required."
                );
        }

        try {
                return ResponseEntity.ok(
                        regressionInvestigationService.investigate(
                                owner, repo, pullNumber
                        )
                );
        } catch (IllegalArgumentException ex) {
                return ResponseEntity.status(404).body(ex.getMessage());
        }
        }
        
        }
