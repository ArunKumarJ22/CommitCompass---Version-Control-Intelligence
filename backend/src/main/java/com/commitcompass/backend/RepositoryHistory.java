
package com.commitcompass.backend;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "repository_history")
public class RepositoryHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String owner;

    @Column(nullable = false)
    private String repo;

    @Column(name = "last_explored_at", nullable = false)
    private Instant lastExploredAt;

    protected RepositoryHistory() {
    }

    public RepositoryHistory(String owner, String repo) {
        this.owner = owner;
        this.repo = repo;
        this.lastExploredAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getOwner() {
        return owner;
    }

    public String getRepo() {
        return repo;
    }

    public Instant getLastExploredAt() {
        return lastExploredAt;
    }

    public void updateLastExploredAt() {
        this.lastExploredAt = Instant.now();
    }
}
