package com.officeagent.engine.node.impl;

import com.officeagent.engine.model.Node;
import com.officeagent.engine.node.NodeExecutor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class InputNodeExecutor implements NodeExecutor {

    @Override
    public String getType() {
        return "input";
    }

    @Override
    public Map<String, Object> execute(Node node, Map<String, Object> context) {
        // Input node typically just passes initial context through or validates it
        // Ensure "input" from external request is mapped to "user_input" if needed by downstream
        // Or simply expose node ID based output
        Map<String, Object> result = new HashMap<>();
        if (context.containsKey("input")) {
            // Standardize: node_id.output = user_input
            // In WorkflowExecutor, the result map keys are usually put directly into context
            // To support "nodeId.output", we should probably key it as "output" here, 
            // AND WorkflowExecutor should namespace it by node ID.
            
            // For now, let's just put "output"
            result.put("output", context.get("input"));
            
            // Also keep global access if needed
            result.put("user_input", context.get("input"));
        }
        return result;
    }
}
