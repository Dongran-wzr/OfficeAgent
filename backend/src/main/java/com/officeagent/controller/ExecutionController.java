package com.officeagent.controller;

import com.officeagent.domain.ExecutionLog;
import com.officeagent.engine.core.WorkflowExecutor;
import com.officeagent.engine.model.Graph;
import com.officeagent.service.ExecutionLogService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/execute")
@CrossOrigin(origins = "http://localhost:5173")
public class ExecutionController {

    private final WorkflowExecutor workflowExecutor;
    private final ExecutionLogService executionLogService;

    public ExecutionController(WorkflowExecutor workflowExecutor, ExecutionLogService executionLogService) {
        this.workflowExecutor = workflowExecutor;
        this.executionLogService = executionLogService;
    }

    @PostMapping
    public Map<String, Object> execute(@RequestBody ExecutionRequest request) {
        ExecutionLog log = new ExecutionLog();
        log.setStartTime(LocalDateTime.now());
        log.setStatus("RUNNING");
        log.setInputData(String.valueOf(request.getInput()));
        executionLogService.save(log);

        try {
            Map<String, Object> result = workflowExecutor.execute(request.getGraph(), request.getInput());
            
            log.setStatus("COMPLETED");
            log.setEndTime(LocalDateTime.now());
            log.setOutputData(String.valueOf(result));
            executionLogService.updateById(log);
            
            return result;
        } catch (Exception e) {
            log.setStatus("FAILED");
            log.setEndTime(LocalDateTime.now());
            log.setExecutionDetails(e.getMessage());
            executionLogService.updateById(log);
            throw e;
        }
    }
    
    // Simple DTO for request
    public static class ExecutionRequest {
        private Graph graph;
        private Map<String, Object> input;

        public Graph getGraph() { return graph; }
        public void setGraph(Graph graph) { this.graph = graph; }
        public Map<String, Object> getInput() { return input; }
        public void setInput(Map<String, Object> input) { this.input = input; }
    }
}
