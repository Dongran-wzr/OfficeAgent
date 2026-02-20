package com.officeagent.engine.core;

import com.officeagent.engine.model.Graph;
import com.officeagent.engine.model.Node;
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

    public Map<String, Object> execute(Graph graph, Map<String, Object> initialInput) {
        List<Node> sortedNodes = dagEngine.topologicalSort(graph);
        Map<String, Object> context = new HashMap<>(initialInput);

        for (Node node : sortedNodes) {
            NodeExecutor executor = executorMap.get(node.getType());
            if (executor != null) {
                Map<String, Object> result = executor.execute(node, context);
                if (result != null) {
                    context.putAll(result);
                }
            } else {
                System.err.println("No executor found for node type: " + node.getType());
            }
        }
        return context;
    }
}
