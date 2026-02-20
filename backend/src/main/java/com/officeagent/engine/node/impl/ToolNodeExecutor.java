package com.officeagent.engine.node.impl;

import com.officeagent.engine.model.Node;
import com.officeagent.engine.node.NodeExecutor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class ToolNodeExecutor implements NodeExecutor {

    @Override
    public String getType() {
        return "tool"; // Specifically for "Audio Synthesis" in this context
    }

    @Override
    public Map<String, Object> execute(Node node, Map<String, Object> context) {
        String textToSynthesize = (String) context.get("output"); // Get input from previous node
        if (textToSynthesize == null) {
            textToSynthesize = "No input provided for audio synthesis.";
        }
        
        // Mock Audio Synthesis (Return a dummy URL or file path)
        // In a real implementation, call an external TTS API
        String audioUrl = "http://localhost:8080/audio/generated_audio.mp3";
        
        System.out.println("Synthesizing audio for: " + textToSynthesize);

        Map<String, Object> result = new HashMap<>();
        result.put("audioUrl", audioUrl);
        return result;
    }
}
