package com.officeagent.engine.core;

import com.officeagent.engine.model.Graph;
import com.officeagent.engine.model.Node;
import com.officeagent.engine.model.execution.ExecutionResult;
import com.officeagent.engine.model.execution.StepResult;
import com.officeagent.engine.node.NodeExecutor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class WorkflowExecutor {

    private final DagEngine dagEngine;
    private final Map<String, NodeExecutor> executorMap;

    public WorkflowExecutor(DagEngine dagEngine, List<NodeExecutor> executors) {
        this.dagEngine = dagEngine;
        this.executorMap = new HashMap<>();
        for (NodeExecutor executor : executors) {
            this.executorMap.put(executor.getType(), executor);
        }
    }

    public ExecutionResult execute(Graph graph, Map<String, Object> initialInput) {
        return execute(graph, initialInput, null);
    }

    public ExecutionResult execute(Graph graph, Map<String, Object> initialInput, ExecutionListener listener) {
        ExecutionResult executionResult = new ExecutionResult();
        long startTime = System.currentTimeMillis();
        
        if (listener != null) {
            listener.onWorkflowStart();
        }
        
        try {
            List<Node> sortedNodes = dagEngine.topologicalSort(graph);
            Map<String, Object> context = new HashMap<>(initialInput);
            
            for (Node node : sortedNodes) {
                StepResult step = new StepResult();
                step.setNodeId(node.getId());
                step.setNodeName((String) node.getData().getOrDefault("label", node.getType()));
                step.setNodeType(node.getType());
                step.setInput(new HashMap<>(context)); // Snapshot context as input (simplified)
                
                if (listener != null) {
                    listener.onNodeStart(step.getNodeId(), step.getNodeName(), step.getNodeType());
                }
                
                long nodeStartTime = System.currentTimeMillis();
                try {
                    NodeExecutor executor = executorMap.get(node.getType());
                    if (executor != null) {
                        Map<String, Object> result = executor.execute(node, context);
                        if (result != null) {
                            context.putAll(result);
                            // Also namespace result by node ID for referencing: {{nodeId.output}}
                            for (Map.Entry<String, Object> entry : result.entrySet()) {
                                context.put(node.getId() + "." + entry.getKey(), entry.getValue());
                            }
                            step.setOutput(result);
                        }
                        step.setStatus("SUCCESS");
                    } else {
                        step.setStatus("SKIPPED");
                        step.setError("No executor found");
                    }
                } catch (Exception e) {
                    step.setStatus("FAILED");
                    step.setError(e.getMessage());
                    if (listener != null) {
                        listener.onError(e.getMessage());
                    }
                    throw e; // Stop execution on failure
                } finally {
                    step.setDuration(System.currentTimeMillis() - nodeStartTime);
                    executionResult.getSteps().add(step);
                    if (listener != null) {
                        listener.onNodeEnd(step);
                    }
                }
            }
            
            executionResult.setStatus("SUCCESS");
            
            // Only include the output of the "output" node as final output
            Map<String, Object> finalOutput = new HashMap<>();
            StepResult lastOutputStep = executionResult.getSteps().stream()
                .filter(s -> "output".equals(s.getNodeType()) && "SUCCESS".equals(s.getStatus()))
                .reduce((first, second) -> second) // Get the last one
                .orElse(null);
                
            if (lastOutputStep != null && lastOutputStep.getOutput() != null) {
                finalOutput.putAll(lastOutputStep.getOutput());
            } 
            
            // Always try to merge 'voice_url' from context if not present, to ensure audio playback works
            if (!finalOutput.containsKey("voice_url") && context.containsKey("voice_url")) {
                finalOutput.put("voice_url", context.get("voice_url"));
            }
            
            if (finalOutput.isEmpty()) {
                // If no dedicated "output" node found (or it failed), try to find any "final_result" or "voice_url" in context
                // This is a fallback for simple workflows or when OutputNode type string mismatch
                if (context.containsKey("final_result")) {
                    finalOutput.put("final_result", context.get("final_result"));
                }
            }
            executionResult.setFinalOutput(finalOutput);
            
        } catch (Exception e) {
            executionResult.setStatus("FAILED");
            executionResult.setError(e.getMessage());
            if (listener != null && executionResult.getSteps().isEmpty()) {
                 // If failed before any step, notify error
                 listener.onError(e.getMessage());
            }
        } finally {
            executionResult.setTotalDuration(System.currentTimeMillis() - startTime);
            if (listener != null) {
                listener.onWorkflowEnd(executionResult);
            }
        }
        
        return executionResult;
    }
}
