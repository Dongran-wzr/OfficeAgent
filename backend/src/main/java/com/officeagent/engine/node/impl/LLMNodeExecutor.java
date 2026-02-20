package com.officeagent.engine.node.impl;

import com.officeagent.engine.model.Node;
import com.officeagent.engine.node.NodeExecutor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class LLMNodeExecutor implements NodeExecutor {

    private final ChatClient chatClient;

    public LLMNodeExecutor(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @Override
    public String getType() {
        return "llm";
    }

    @Override
    public Map<String, Object> execute(Node node, Map<String, Object> context) {
        // Extract prompt or messages from node configuration
        String promptTemplate = (String) node.getData().get("prompt");
        // Simple substitution (in a real app, use a template engine)
        String prompt = promptTemplate;
        if (context.containsKey("input") && promptTemplate != null) {
             prompt = promptTemplate.replace("{{input}}", (String) context.get("input"));
        } else if (prompt == null) {
            prompt = (String) context.get("input"); // Fallback to direct input if no prompt template
        }

        // Call AI
        String response = chatClient.prompt(prompt).call().content();

        Map<String, Object> result = new HashMap<>();
        result.put("llm_output", response);
        result.put("output", response); // Map to standard output key
        return result;
    }
}
