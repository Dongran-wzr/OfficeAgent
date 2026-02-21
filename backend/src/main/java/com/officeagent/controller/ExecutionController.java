package com.officeagent.controller;

import com.officeagent.domain.ExecutionLog;
import com.officeagent.engine.core.ExecutionListener;
import com.officeagent.engine.core.WorkflowExecutor;
import com.officeagent.engine.model.Graph;
import com.officeagent.engine.model.execution.ExecutionResult;
import com.officeagent.engine.model.execution.StepResult;
import com.officeagent.service.ExecutionLogService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/execute")
@CrossOrigin(origins = "http://localhost:5173")
public class ExecutionController {

    private final WorkflowExecutor workflowExecutor;
    private final ExecutionLogService executionLogService;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    public ExecutionController(WorkflowExecutor workflowExecutor, ExecutionLogService executionLogService) {
        this.workflowExecutor = workflowExecutor;
        this.executionLogService = executionLogService;
    }

    @PostMapping("/stream")
    public SseEmitter executeStream(@RequestBody ExecutionRequest request) {
        SseEmitter emitter = new SseEmitter(180000L); // 3 minutes timeout

        executorService.execute(() -> {
            ExecutionLog log = new ExecutionLog();
            log.setStartTime(LocalDateTime.now());
            log.setStatus("RUNNING");
            log.setInputData(String.valueOf(request.getInput()));
            executionLogService.save(log);

            try {
                workflowExecutor.execute(request.getGraph(), request.getInput(), new ExecutionListener() {
                    @Override
                    public void onNodeStart(String nodeId, String nodeName, String nodeType) {
                        try {
                            emitter.send(SseEmitter.event().name("NODE_START").data(Map.of(
                                "nodeId", nodeId,
                                "nodeName", nodeName,
                                "nodeType", nodeType,
                                "timestamp", System.currentTimeMillis()
                            )));
                        } catch (IOException e) {
                            emitter.completeWithError(e);
                        }
                    }

                    @Override
                    public void onNodeEnd(StepResult stepResult) {
                        try {
                            emitter.send(SseEmitter.event().name("NODE_END").data(stepResult));
                        } catch (IOException e) {
                            emitter.completeWithError(e);
                        }
                    }

                    @Override
                    public void onWorkflowStart() {
                        try {
                            emitter.send(SseEmitter.event().name("WORKFLOW_START").data("Workflow started"));
                        } catch (IOException e) {
                            emitter.completeWithError(e);
                        }
                    }

                    @Override
                    public void onWorkflowEnd(ExecutionResult result) {
                        // Update log
                        log.setStatus(result.getStatus());
                        log.setEndTime(LocalDateTime.now());
                        log.setOutputData(String.valueOf(result.getFinalOutput()));
                        if ("FAILED".equals(result.getStatus())) {
                            log.setExecutionDetails(result.getError());
                        }
                        executionLogService.updateById(log);

                        try {
                            emitter.send(SseEmitter.event().name("WORKFLOW_END").data(result));
                            emitter.complete();
                        } catch (IOException e) {
                            emitter.completeWithError(e);
                        }
                    }

                    @Override
                    public void onError(String error) {
                        // Log error is handled in onWorkflowEnd usually, but if early fail:
                        try {
                            emitter.send(SseEmitter.event().name("ERROR").data(error));
                        } catch (IOException e) {
                            emitter.completeWithError(e);
                        }
                    }
                });
            } catch (Exception e) {
                log.setStatus("FAILED");
                log.setEndTime(LocalDateTime.now());
                log.setExecutionDetails(e.getMessage());
                executionLogService.updateById(log);
                
                try {
                    emitter.completeWithError(e);
                } catch (Exception ex) {
                    // ignore
                }
            }
        });

        return emitter;
    }

    @PostMapping
    public ExecutionResult execute(@RequestBody ExecutionRequest request) {
        ExecutionLog log = new ExecutionLog();
        log.setStartTime(LocalDateTime.now());
        log.setStatus("RUNNING");
        log.setInputData(String.valueOf(request.getInput()));
        executionLogService.save(log);

        try {
            ExecutionResult result = workflowExecutor.execute(request.getGraph(), request.getInput());
            
            log.setStatus(result.getStatus());
            log.setEndTime(LocalDateTime.now());
            log.setOutputData(String.valueOf(result.getFinalOutput()));
            if ("FAILED".equals(result.getStatus())) {
                log.setExecutionDetails(result.getError());
            }
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
