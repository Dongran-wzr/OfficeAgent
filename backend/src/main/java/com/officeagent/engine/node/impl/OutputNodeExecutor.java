package com.officeagent.engine.node.impl;

import com.officeagent.engine.model.Node;
import com.officeagent.engine.node.NodeExecutor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class OutputNodeExecutor implements NodeExecutor {

    @Override
    public String getType() {
        return "output";
    }

    @Override
    public Map<String, Object> execute(Node node, Map<String, Object> context) {
        // Output node marks the end, maybe formats the final result
        Map<String, Object> finalResult = new HashMap<>();
        finalResult.put("final_result", context.get("output"));
        if (context.containsKey("audioUrl")) {
            finalResult.put("final_audio", context.get("audioUrl"));
        }
        return finalResult;
    }
}
