package com.officeagent.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("execution_log")
public class ExecutionLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long workflowId;
    
    // Status: RUNNING, COMPLETED, FAILED
    private String status;
    
    // Input parameters
    private String inputData;
    
    // Output result
    private String outputData;
    
    // Detailed logs for each node execution
    private String executionDetails; 
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
