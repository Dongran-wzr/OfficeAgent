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
        ExecutionResult executionResult = new ExecutionResult();
        long startTime = System.currentTimeMillis();
        
        try {
            List<Node> sortedNodes = dagEngine.topologicalSort(graph);
            Map<String, Object> context = new HashMap<>(initialInput);
            
            for (Node node : sortedNodes) {
                StepResult step = new StepResult();
                step.setNodeId(node.getId());
                step.setNodeName((String) node.getData().getOrDefault("label", node.getType()));
                step.setNodeType(node.getType());
                step.setInput(new HashMap<>(context)); // Snapshot context as input (simplified)
                
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
                    throw e; // Stop execution on failure
                } finally {
                    step.setDuration(System.currentTimeMillis() - nodeStartTime);
                    executionResult.getSteps().add(step);
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
            } else {
                // Fallback: if no output node, return context (or empty?)
                // User requested ONLY final output, so maybe just empty if no output node found.
                // Or maybe the context contains "final_result" key from OutputNodeExecutor
                if (context.containsKey("final_result")) {
                    finalOutput.put("final_result", context.get("final_result"));
                }
            }
            executionResult.setFinalOutput(finalOutput);
            
        } catch (Exception e) {
            executionResult.setStatus("FAILED");
            executionResult.setError(e.getMessage());
        } finally {
            executionResult.setTotalDuration(System.currentTimeMillis() - startTime);
        }
        
        return executionResult;
    }
}
