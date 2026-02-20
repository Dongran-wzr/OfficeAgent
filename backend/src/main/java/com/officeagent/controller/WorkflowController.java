package com.officeagent.controller;

import com.officeagent.domain.Workflow;
import com.officeagent.service.WorkflowService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/workflow")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}) // Allow frontend access
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping
    public Workflow save(@RequestBody Workflow workflow) {
        if (workflow.getId() == null) {
            workflow.setCreatedAt(LocalDateTime.now());
        }
        workflow.setUpdatedAt(LocalDateTime.now());
        workflowService.saveOrUpdate(workflow);
        return workflow;
    }

    @GetMapping("/{id}")
    public Workflow get(@PathVariable Long id) {
        return workflowService.getById(id);
    }

    @GetMapping
    public List<Workflow> list() {
        return workflowService.list();
    }
}
