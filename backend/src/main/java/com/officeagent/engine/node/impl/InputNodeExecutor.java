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
        return new HashMap<>();
    }
}
