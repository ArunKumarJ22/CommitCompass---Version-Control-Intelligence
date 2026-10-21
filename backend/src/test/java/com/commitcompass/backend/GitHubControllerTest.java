
package com.commitcompass.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import tools.jackson.databind.JsonNode;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class GitHubControllerTest {

    private GitHubService gitHubService;
    private CommitPersistenceService commitPersistenceService;
    private RegressionInvestigationService regressionInvestigationService;
    private GitHubController controller;

    @BeforeEach
    void setUp() {
        gitHubService = mock(GitHubService.class);
        commitPersistenceService = mock(CommitPersistenceService.class);
        regressionInvestigationService =
                mock(RegressionInvestigationService.class);

        controller = new GitHubController(
                gitHubService,
                commitPersistenceService,
                regressionInvestigationService
        );
    }

    @Test
    void blankOwnerIsRejectedForLiveCommits() {
        ResponseEntity<?> response =
                controller.getCommits(" ", "react");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(gitHubService, commitPersistenceService);
    }

    @Test
    void blankRepositoryIsRejectedForSync() {
        ResponseEntity<?> response =
                controller.syncCommits("facebook", " ");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(gitHubService, commitPersistenceService);
    }

    @Test
    void blankOwnerIsRejectedForSavedCommits() {
        ResponseEntity<?> response =
                controller.getSavedCommits("", "react");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(gitHubService, commitPersistenceService);
    }

    @Test
    void validOwnerAndRepositoryReturnSuccessfulResponse() {
        JsonNode commits = mock(JsonNode.class);

        when(gitHubService.getCommits("facebook", "react"))
                .thenReturn(commits);

        ResponseEntity<?> response =
                controller.getCommits("facebook", "react");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(commits, response.getBody());
        verify(gitHubService).getCommits("facebook", "react");
    }

    @Test
    void blankShaIsRejectedForCommitDetails() {
        ResponseEntity<?> response =
                controller.getCommitDetails("facebook", "react", " ");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(gitHubService, commitPersistenceService);
    }

    @Test
    void validCommitDetailsReturnSuccessfulResponse() {
        JsonNode details = mock(JsonNode.class);

        when(gitHubService.getCommitDetails(
                "facebook", "react", "abc123"
        )).thenReturn(details);

        ResponseEntity<?> response =
                controller.getCommitDetails("facebook", "react", "abc123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(details, response.getBody());

        verify(gitHubService).getCommitDetails(
                "facebook", "react", "abc123"
        );
    }

    @Test
    void blankOwnerIsRejectedForRegressionInvestigation() {
        ResponseEntity<?> response =
                controller.investigateRegression(" ", "react", 123);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(regressionInvestigationService);
    }

    @Test
    void blankRepositoryIsRejectedForRegressionInvestigation() {
        ResponseEntity<?> response =
                controller.investigateRegression("facebook", " ", 123);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(regressionInvestigationService);
    }

    @Test
    void invalidPullNumberIsRejectedForRegressionInvestigation() {
        ResponseEntity<?> response =
                controller.investigateRegression("facebook", "react", 0);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(regressionInvestigationService);
    }

    @Test
    void regressionServiceFailureReturnsNotFound() {
        when(regressionInvestigationService.investigate(
                "facebook", "react", 123
        )).thenThrow(new IllegalArgumentException("Pull request not found"));

        ResponseEntity<?> response =
                controller.investigateRegression("facebook", "react", 123);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Pull request not found", response.getBody());

        verify(regressionInvestigationService).investigate(
                "facebook", "react", 123
        );
    }
}
