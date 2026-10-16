
package com.commitcompass.backend;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RepositoryHistoryRepository
        extends JpaRepository<RepositoryHistory, Long> {

    List<RepositoryHistory> findAllByOrderByLastExploredAtDesc();

    Optional<RepositoryHistory> findByOwnerIgnoreCaseAndRepoIgnoreCase(
            String owner,
            String repo
    );
}
