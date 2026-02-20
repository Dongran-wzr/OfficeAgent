package com.officeagent.engine.model;

import lombok.Data;
import java.util.Map;

@Data
public class Node {
    private String id;
    private String type; // input, llm, tool, output
    private Map<String, Object> data;
}
