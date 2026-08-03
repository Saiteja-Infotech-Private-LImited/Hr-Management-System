package com.hrms.repository;

import com.hrms.entity.JobPosting;
import com.hrms.entity.JobPosting.PostingStatus;
import com.hrms.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    
    @EntityGraph(attributePaths = {"applications"})
    Page<JobPosting> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"applications"})
    Page<JobPosting> findByStatus(PostingStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"applications"})
    Page<JobPosting> findByDepartment(String department, Pageable pageable);
}
