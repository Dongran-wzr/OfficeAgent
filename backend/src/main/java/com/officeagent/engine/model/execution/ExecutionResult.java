package com.officeagent.engine.model.execution;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ExecutionResult {
    private String status; // "SUCCESS", "FAILED"
    private long totalDuration; // ms
    private List<StepResult> steps = new ArrayList<>();
    private Map<String, Object> finalOutput;
    private String error;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public long getTotalDuration() { return totalDuration; }
    public void setTotalDuration(long totalDuration) { this.totalDuration = totalDuration; }
    public List<StepResult> getSteps() { return steps; }
    public void setSteps(List<StepResult> steps) { this.steps = steps; }
    public Map<String, Object> getFinalOutput() { return finalOutput; }
    public void setFinalOutput(Map<String, Object> finalOutput) { this.finalOutput = finalOutput; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
