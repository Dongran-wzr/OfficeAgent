package com.officeagent.engine.node.impl;

import com.officeagent.engine.model.Node;
import com.officeagent.engine.node.NodeExecutor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class LLMNodeExecutor implements NodeExecutor {

    private final ChatClient.Builder chatClientBuilder;

    public LLMNodeExecutor(ChatClient.Builder chatClientBuilder) {
        this.chatClientBuilder = chatClientBuilder;
    }

    @Override
    public String getType() {
        return "llm";
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> execute(Node node, Map<String, Object> context) {
        Map<String, Object> data = node.getData();
        Map<String, Object> inputParams = new HashMap<>();

        // 1. Process Input Parameters
        if (data.containsKey("inputParams")) {
            List<Map<String, Object>> params = (List<Map<String, Object>>) data.get("inputParams");
            for (Map<String, Object> param : params) {
                String name = (String) param.get("name");
                String type = (String) param.get("type");
                Object value = param.get("value");

                if ("reference".equals(type) && value instanceof String) {
                    inputParams.put(name, resolveValue((String) value, context));
                } else {
                    inputParams.put(name, value);
                }
            }
        }
        
        // 2. Get Prompt
        String promptTemplate = (String) data.get("prompt");
        String prompt = promptTemplate;
        if (promptTemplate != null) {
            // Replace {{paramName}} from inputParams
            for (Map.Entry<String, Object> entry : inputParams.entrySet()) {
                String key = entry.getKey();
                String val = String.valueOf(entry.getValue());
                prompt = prompt.replace("{{" + key + "}}", val);
            }

            // Replace {{input}} from context (legacy support)
            if (context.containsKey("user_input")) {
                 prompt = prompt.replace("{{input}}", String.valueOf(context.get("user_input")));
            } else if (context.containsKey("input")) {
                 prompt = prompt.replace("{{input}}", String.valueOf(context.get("input")));
            }
            
            // Also replace references like {{nodeId.output}} directly in prompt if needed
            for (Map.Entry<String, Object> entry : context.entrySet()) {
                String key = entry.getKey();
                String val = String.valueOf(entry.getValue());
                prompt = prompt.replace("{{" + key + "}}", val);
            }
        } else {
            prompt = (String) context.get("input"); // Fallback
        }

        // 3. Configure Dynamic Client
        String apiKey = (String) data.get("apiKey");
        String apiBaseUrl = (String) data.get("apiBaseUrl");
        String model = (String) data.getOrDefault("model", "deepseek-chat"); 
        Double temperature = 0.7;
        try {
            if (data.get("temperature") != null) {
                temperature = Double.parseDouble(String.valueOf(data.get("temperature")));
            }
        } catch (NumberFormatException e) {
            // ignore
        }

        ChatClient client;
        if (apiKey != null && !apiKey.isEmpty() && apiBaseUrl != null && !apiBaseUrl.isEmpty()) {
            // Trim any trailing spaces or invalid characters from URL
            String baseUrl = apiBaseUrl.trim();
            // Ensure no duplicate /v1/chat/completions suffix if user pasted full path
            // OpenAiApi expects base URL, it appends /v1/chat/completions itself
            // If user provides "https://api.deepseek.com/v1/chat/completions", we should strip it or OpenAiApi might double it
            // Actually OpenAiApi(baseUrl, apiKey) uses baseUrl as base. 
            // It seems the user input "https://api.deepseek.com" is correct for standard OpenAI compatible APIs.
            // The error "Illegal character in scheme name at index 0: %20" suggests there is a leading space or URL encoded space.
            
            // Clean up the URL
            baseUrl = baseUrl.replaceAll("^\\s+|\\s+$", ""); // Trim whitespace
            if (baseUrl.endsWith("/v1/chat/completions")) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - "/v1/chat/completions".length());
            } else if (baseUrl.endsWith("/chat/completions")) {
                 baseUrl = baseUrl.substring(0, baseUrl.length() - "/chat/completions".length());
            }
            if (baseUrl.endsWith("/")) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
            }
            
            // Fix model name mapping
            if ("DeepSeek".equalsIgnoreCase(model)) {
                model = "deepseek-chat";
            }
            
            OpenAiApi openAiApi = new OpenAiApi(baseUrl, apiKey);
            OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, OpenAiChatOptions.builder()
                    .withModel(model)
                    .withTemperature(temperature)
                    .build());
            client = ChatClient.create(chatModel);
        } else {
            client = chatClientBuilder.build();
        }

        // 4. Call AI
        String response = client.prompt(prompt).call().content();

        // 5. Process Output Parameters
        Map<String, Object> result = new HashMap<>();
        result.put("llm_output", response);
        result.put("output", response); // Default output
        
        // Map response to defined output variables
        if (data.containsKey("outputParams")) {
            List<Map<String, Object>> outParams = (List<Map<String, Object>>) data.get("outputParams");
            for (Map<String, Object> param : outParams) {
                String name = (String) param.get("name");
                // Currently only support string output (the full response)
                // Future: support JSON parsing or regex extraction
                result.put(name, response);
            }
        }
        
        return result;
    }

    private Object resolveValue(String refKey, Map<String, Object> context) {
        if (refKey == null) return null;
        String key = refKey.trim();
        if (key.startsWith("{{") && key.endsWith("}}")) {
            key = key.substring(2, key.length() - 2).trim();
        }
        if (context.containsKey(key)) {
            return context.get(key);
        }
        return context.getOrDefault(key, null);
    }
}
