package com.officeagent.engine.model.execution;

import java.util.Map;

public class StepResult {
    private String nodeId;
    private String nodeName; // Optional: if we can get label
    private String nodeType;
    private String status; // "SUCCESS", "FAILED", "SKIPPED"
    private long duration; // ms
    private Map<String, Object> input; // Snapshot of context before execution (or specific inputs)
    private Map<String, Object> output; // Result of execution
    private String error;

    public String getNodeId() { return nodeId; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }
    public String getNodeName() { return nodeName; }
    public void setNodeName(String nodeName) { this.nodeName = nodeName; }
    public String getNodeType() { return nodeType; }
    public void setNodeType(String nodeType) { this.nodeType = nodeType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public long getDuration() { return duration; }
    public void setDuration(long duration) { this.duration = duration; }
    public Map<String, Object> getInput() { return input; }
    public void setInput(Map<String, Object> input) { this.input = input; }
    public Map<String, Object> getOutput() { return output; }
    public void setOutput(Map<String, Object> output) { this.output = output; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
