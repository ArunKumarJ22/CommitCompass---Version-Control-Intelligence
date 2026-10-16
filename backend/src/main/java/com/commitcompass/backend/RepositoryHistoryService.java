
package com.commitcompass.backend;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RepositoryHistoryService {

    private final RepositoryHistoryRepository repository;

    public RepositoryHistoryService(RepositoryHistoryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public RepositoryHistory recordExploration(String owner, String repo) {
        String normalizedOwner = owner.trim();
        String normalizedRepo = repo.trim();

        RepositoryHistory history = repository
                .findByOwnerIgnoreCaseAndRepoIgnoreCase(
                        normalizedOwner,
                        normalizedRepo
                )
                .orElseGet(() ->
                        new RepositoryHistory(normalizedOwner, normalizedRepo)
                );

        history.updateLastExploredAt();

        return repository.save(history);
    }

    @Transactional(readOnly = true)
    public List<RepositoryHistory> getRecentHistory() {
        return repository.findAllByOrderByLastExploredAtDesc()
                .stream()
                .limit(10)
                .toList();
    }
}
