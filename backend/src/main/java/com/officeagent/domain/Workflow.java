package com.officeagent.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("workflow")
public class Workflow {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String description;
    
    // Stores the JSON representation of nodes and edges
    private String graphData; 
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
