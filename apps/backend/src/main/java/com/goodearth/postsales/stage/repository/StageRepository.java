package com.goodearth.postsales.stage.repository;

import com.goodearth.postsales.stage.entity.Stage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StageRepository extends JpaRepository<Stage, UUID> {
    Optional<Stage> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsBySequenceOrder(int sequenceOrder);
    boolean existsByCodeAndIdNot(String code, UUID id);
    boolean existsBySequenceOrderAndIdNot(int sequenceOrder, UUID id);
}
