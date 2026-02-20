package com.officeagent.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.officeagent.domain.Workflow;
import com.officeagent.mapper.WorkflowMapper;
import org.springframework.stereotype.Service;

@Service
public class WorkflowService extends ServiceImpl<WorkflowMapper, Workflow> {
}
