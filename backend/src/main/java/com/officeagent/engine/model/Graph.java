package com.officeagent.engine.model;

import lombok.Data;
import java.util.List;

@Data
public class Graph {
    private List<Node> nodes;
    private List<Edge> edges;
}
