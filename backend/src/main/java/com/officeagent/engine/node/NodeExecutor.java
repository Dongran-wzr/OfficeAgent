package com.officeagent.engine.node;

import com.officeagent.engine.model.Node;
import java.util.Map;

public interface NodeExecutor {
    String getType();
    Map<String, Object> execute(Node node, Map<String, Object> context);
}
