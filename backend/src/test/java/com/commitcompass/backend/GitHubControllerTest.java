package com.commitcompass.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import tools.jackson.databind.JsonNode;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GitHubControllerTest {

    private GitHubService gitHubService;
    private CommitPersistenceService commitPersistenceService;
    private GitHubController controller;

    @BeforeEach
    void setUp() {
        gitHubService = mock(GitHubService.class);
        commitPersistenceService = mock(CommitPersistenceService.class);
        RegressionInvestigationService regressionInvestigationService =
        org.mockito.Mockito.mock(RegressionInvestigationService.class);

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
                "facebook",
                "react",
                "abc123"
        )).thenReturn(details);

        ResponseEntity<?> response =
                controller.getCommitDetails("facebook", "react", "abc123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(details, response.getBody());

        verify(gitHubService).getCommitDetails(
                "facebook",
                "react",
                "abc123"
        );
    }


}
