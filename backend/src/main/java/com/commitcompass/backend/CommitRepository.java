
package com.commitcompass.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CommitRepository extends JpaRepository<Commit, Long> {

    List<Commit> findByRepositoryOwnerAndRepositoryName(
            String repositoryOwner,
            String repositoryName
    );

     Optional<Commit> findBySha(String sha);
}
