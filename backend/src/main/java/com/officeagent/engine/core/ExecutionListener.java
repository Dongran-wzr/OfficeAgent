package com.officeagent.engine.core;

import com.officeagent.engine.model.execution.ExecutionResult;
import com.officeagent.engine.model.execution.StepResult;

public interface ExecutionListener {
    void onNodeStart(String nodeId, String nodeName, String nodeType);
    void onNodeEnd(StepResult stepResult);
    void onWorkflowStart();
    void onWorkflowEnd(ExecutionResult result);
    void onError(String error);
}
