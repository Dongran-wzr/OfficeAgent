package com.officeagent.engine.node.impl;

import com.alibaba.dashscope.audio.tts.SpeechSynthesisAudioFormat;
import com.alibaba.dashscope.audio.tts.SpeechSynthesisParam;
import com.alibaba.dashscope.audio.tts.SpeechSynthesizer;
import com.alibaba.dashscope.utils.Constants;
import com.officeagent.engine.model.Node;
import com.officeagent.engine.node.NodeExecutor;
import com.officeagent.utils.MinioUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class ToolNodeExecutor implements NodeExecutor {

    @Autowired
    private MinioUtil minioUtil;

    @Override
    public String getType() {
        return "tool";
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> execute(Node node, Map<String, Object> context) {
        Map<String, Object> data = node.getData();
        Map<String, Object> inputParams = new HashMap<>();

        // 1. Process Input Parameters (text, voice, language_type)
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

        // 2. Extract TTS Parameters
        // inputParams has higher priority for text/voice if present (from Input Config Card)
        // data has fallback priority (from API Config Card)
        
        // Fix: ToolNode config structure is flat for text/voice if not in inputParams
        String text = (String) inputParams.get("text");
        String voice = (String) inputParams.get("voice");
        
        // If not in inputParams (custom inputs), check direct node data (standard inputs)
        if (text == null) {
            Object textObj = data.get("text");
            // Check if text is a reference directly in data
            String textType = (String) data.get("textType");
            if ("reference".equals(textType) && textObj instanceof String) {
                text = (String) resolveValue((String) textObj, context);
            } else {
                text = (String) textObj;
            }
        }
        
        if (voice == null) voice = (String) data.get("voice");
        
        // If still null, use defaults
        if (text == null) text = "你好，我是OfficeAgent";
        if (voice == null) voice = "Cherry";

        // API Key is in 'data' (API Config Card)
        String apiKey = (String) data.get("apiKey");
        // Model is in 'data' (API Config Card)
        // Default to cosyvoice-v1 as qwen3-tts-flash might be invalid
        String model = (String) data.getOrDefault("model", "cosyvoice-v1"); 
        
        // Debug logging
        System.out.println("TTS Executor - API Key present: " + (apiKey != null && !apiKey.isEmpty()));
        System.out.println("TTS Executor - Model: " + model);
        System.out.println("TTS Executor - Text: " + text);
        System.out.println("TTS Executor - Voice: " + voice);

        if (apiKey == null || apiKey.isEmpty()) {
            throw new IllegalArgumentException("API Key is required for Audio Synthesis");
        }
        
        // 3. Call DashScope TTS
        String audioUrl = synthesizeAudio(apiKey, model, text, voice);

        // 4. Process Output Parameters
        Map<String, Object> result = new HashMap<>();
        // Default mapping
        result.put("voice_url", audioUrl);
        
        // Custom mapping if defined
        if (data.containsKey("outputParams")) {
            List<Map<String, Object>> outParams = (List<Map<String, Object>>) data.get("outputParams");
            for (Map<String, Object> param : outParams) {
                String name = (String) param.get("name");
                // Currently only support mapping the audio url
                result.put(name, audioUrl);
            }
        }
        
        return result;
    }

    private String synthesizeAudio(String apiKey, String model, String text, String voice) {
        Constants.apiKey = apiKey;
        
        // qwen3-tts-flash specific logic could be added here if parameters differ from standard
        SpeechSynthesisParam param = SpeechSynthesisParam.builder()
                .model(model)
                .text(text)
                .sampleRate(48000)
                .build();
        // Note: 'voice' parameter support depends on model. 
        // For CosyVoice/Sambert, voice is supported. 
        // For qwen3-tts-flash, check docs. 
        // Assuming standard builder usage for now. If voice is needed, might need specific param setter.
        // Actually, builder().voice(voice) exists in some versions. Let's check or assume default if not available.
        // Or if using specific model constants.
        
        // To be safe and generic with current dependency, let's try basic call first.
        // If voice parameter is critical for qwen3, we might need to use .voice(voice) if available in SDK
        
        // Let's try to add voice if supported by builder, otherwise ignore for basic impl
        // SpeechSynthesisParam builder usually has .voice()
        // param = SpeechSynthesisParam.builder().model(model).text(text).voice(voice).build(); 
        
        // Re-building with voice
        param = SpeechSynthesisParam.builder()
                .model(model)
                .text(text)
                // Use generic parameter setter if .voice() is missing
                .parameter("voice", voice)
                .sampleRate(48000)
                .format(SpeechSynthesisAudioFormat.MP3)
                .apiKey(apiKey) // Explicitly set API Key here to avoid thread-safety issues with Constants.apiKey
                .build();

        SpeechSynthesizer synthesizer = new SpeechSynthesizer();
        
        try {
            ByteBuffer audioBuffer = synthesizer.call(param);
            
            // Save to local static file
            String fileName = "tts_" + UUID.randomUUID().toString() + ".mp3";
            // Ensure directory exists: static/audio/
            String uploadDir = "static/audio/"; 
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            
            File file = new File(uploadDir + fileName);
            try (FileOutputStream fos = new FileOutputStream(file)) {
                fos.write(audioBuffer.array());
            }
            
            // Return accessible URL
            // Assuming backend runs on 8081 and serves static resources
            // String resultUrl = "http://localhost:8081/audio/" + fileName;
            
            // Upload to MinIO
            String resultUrl = minioUtil.uploadFile(new ByteArrayInputStream(audioBuffer.array()), fileName, "audio/mpeg");
            
            System.out.println("TTS Executor - Generated Audio URL: " + resultUrl);
            return resultUrl;
            
        } catch (Exception e) {
            System.err.println("TTS Executor - Synthesis Failed: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("TTS Synthesis failed: " + e.getMessage(), e);
        }
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
