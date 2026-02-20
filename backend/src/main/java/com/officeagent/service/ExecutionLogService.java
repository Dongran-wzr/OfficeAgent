package com.officeagent.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.officeagent.domain.ExecutionLog;
import com.officeagent.mapper.ExecutionLogMapper;
import org.springframework.stereotype.Service;

@Service
public class ExecutionLogService extends ServiceImpl<ExecutionLogMapper, ExecutionLog> {
}
