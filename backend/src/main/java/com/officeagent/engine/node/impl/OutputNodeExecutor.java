package com.officeagent.engine.node.impl;

import com.officeagent.engine.model.Node;
import com.officeagent.engine.node.NodeExecutor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class OutputNodeExecutor implements NodeExecutor {

    @Override
    public String getType() {
        return "output";
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> execute(Node node, Map<String, Object> context) {
        Map<String, Object> finalResult = new HashMap<>();
        Map<String, Object> data = node.getData();

        // 1. Process outputParams
        Map<String, Object> processedParams = new HashMap<>();
        if (data.containsKey("outputParams")) {
            List<Map<String, Object>> params = (List<Map<String, Object>>) data.get("outputParams");
            for (Map<String, Object> param : params) {
                String name = (String) param.get("name");
                String type = (String) param.get("type");
                Object value = param.get("value");

                if ("reference".equals(type) && value instanceof String) {
                    // Resolve reference: {{nodeId.output}} or simple key
                    String refKey = (String) value;
                    processedParams.put(name, resolveValue(refKey, context));
                } else {
                    processedParams.put(name, value);
                }
            }
        }
        finalResult.putAll(processedParams);

        // 2. Process responseTemplate
        String template = (String) data.get("responseTemplate");
        if (template != null && !template.isEmpty()) {
            String finalResponse = template;
            // Replace {{paramName}} with values from processedParams
            for (Map.Entry<String, Object> entry : processedParams.entrySet()) {
                String key = entry.getKey();
                Object valObj = entry.getValue();
                String val = valObj != null ? String.valueOf(valObj) : "";
                finalResponse = finalResponse.replace("{{" + key + "}}", val);
            }
            finalResult.put("final_result", finalResponse);
        } else {
             // Fallback if no template
             finalResult.put("final_result", processedParams);
        }

        return finalResult;
    }

    private Object resolveValue(String refKey, Map<String, Object> context) {
        if (refKey == null) return null;
        // Strip {{ }} if present
        String key = refKey.trim();
        if (key.startsWith("{{") && key.endsWith("}}")) {
            key = key.substring(2, key.length() - 2).trim();
        }
        
        // Handle nodeId.output pattern (mocked for now as flat context, 
        // in real engine context keys might be prefixed by nodeId)
        // Current simple context implementation: context.get(key)
        
        // If context keys are "nodeId.output", we look for exact match
        if (context.containsKey(key)) {
            return context.get(key);
        }
        
        // If context contains user_input or simple keys
        return context.getOrDefault(key, null);
    }
}
