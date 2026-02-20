package com.officeagent.engine.core;

import com.officeagent.engine.model.Edge;
import com.officeagent.engine.model.Graph;
import com.officeagent.engine.model.Node;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class DagEngine {

    /**
     * Sort nodes using Kahn's algorithm for topological sorting.
     */
    public List<Node> topologicalSort(Graph graph) {
        List<Node> sortedNodes = new ArrayList<>();
        Map<String, Integer> inDegree = new HashMap<>();
        Map<String, List<String>> adjList = new HashMap<>();

        // Initialize
        for (Node node : graph.getNodes()) {
            inDegree.put(node.getId(), 0);
            adjList.put(node.getId(), new ArrayList<>());
        }

        // Build graph
        for (Edge edge : graph.getEdges()) {
            adjList.get(edge.getSource()).add(edge.getTarget());
            inDegree.put(edge.getTarget(), inDegree.getOrDefault(edge.getTarget(), 0) + 1);
        }

        // Queue for nodes with no incoming edges
        Queue<String> queue = new LinkedList<>();
        for (Map.Entry<String, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.offer(entry.getKey());
            }
        }

        while (!queue.isEmpty()) {
            String nodeId = queue.poll();
            Node node = graph.getNodes().stream()
                    .filter(n -> n.getId().equals(nodeId))
                    .findFirst()
                    .orElseThrow();
            sortedNodes.add(node);

            for (String neighbor : adjList.get(nodeId)) {
                inDegree.put(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) == 0) {
                    queue.offer(neighbor);
                }
            }
        }

        if (sortedNodes.size() != graph.getNodes().size()) {
            throw new RuntimeException("Cycle detected in the workflow graph!");
        }

        return sortedNodes;
    }
}
