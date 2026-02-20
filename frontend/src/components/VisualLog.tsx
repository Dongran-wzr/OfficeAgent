import React from 'react';
import { Card, Collapse, Typography, Tag, Progress, Space, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, RightOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Title } = Typography;

interface StepResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: string;
  duration: number;
  input: Record<string, any>;
  output: Record<string, any>;
  error?: string;
}

interface ExecutionResult {
  status: string;
  totalDuration: number;
  steps: StepResult[];
  finalOutput: Record<string, any>;
  error?: string;
}

interface VisualLogProps {
  result: ExecutionResult | null;
  loading: boolean;
}

const VisualLog: React.FC<VisualLogProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <Spin tip="执行中..." size="large" />
      </div>
    );
  }

  if (!result || (typeof result !== 'object')) {
    return (
      <div style={{ 
        color: '#999', 
        textAlign: 'center', 
        padding: 20, 
        border: '1px dashed #d9d9d9', 
        borderRadius: 4 
      }}>
        暂无执行记录 (数据为空)
      </div>
    );
  }

  const steps = result.steps || [];
  const successSteps = steps.filter(s => s.status === 'SUCCESS').length;
  const totalSteps = steps.length;
  const percent = totalSteps > 0 ? Math.round((successSteps / totalSteps) * 100) : 0;

  return (
    <div className="visual-log" style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 8, background: '#fafafa' }}>
      {/* Header Status */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 16, 
          borderColor: result.status === 'SUCCESS' ? '#b7eb8f' : (result.status === 'FAILED' ? '#ffccc7' : '#d9d9d9'), 
          background: result.status === 'SUCCESS' ? '#f6ffed' : (result.status === 'FAILED' ? '#fff2f0' : '#fff')
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Space>
            <Text strong style={{ fontSize: 16 }}>状态:</Text>
            <Tag color={result.status === 'SUCCESS' ? 'success' : (result.status === 'FAILED' ? 'error' : 'default')}>
              {result.status === 'SUCCESS' ? '成功' : (result.status === 'FAILED' ? '失败' : result.status || '未知')}
            </Tag>
          </Space>
          <Space>
             <ClockCircleOutlined />
             <Text>{result.totalDuration || 0}ms</Text>
          </Space>
        </div>
        <Progress percent={percent} status={result.status === 'SUCCESS' ? 'success' : (result.status === 'FAILED' ? 'exception' : 'normal')} />
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          已完成节点: {successSteps} / {totalSteps}
        </div>
      </Card>

      {/* Execution Steps */}
      {steps.length === 0 ? (
         <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>没有执行步骤</div>
      ) : (
        <Collapse
          bordered={false}
          defaultActiveKey={steps.map(s => s.nodeId)}
          expandIcon={({ isActive }) => <RightOutlined rotate={isActive ? 90 : 0} />}
          style={{ background: 'transparent' }}
        >
          {steps.map((step, index) => (
            <Panel
            key={step.nodeId}
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Space>
                  {step.status === 'SUCCESS' ? 
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  }
                  <Text strong>{step.nodeName || step.nodeId}</Text>
                  <Tag>{step.nodeType}</Tag>
                </Space>
                <Tag color="default">{step.duration}ms</Tag>
              </div>
            }
            style={{ 
              marginBottom: 10, 
              background: '#fff', 
              borderRadius: 8, 
              border: '1px solid #f0f0f0',
              overflow: 'hidden' 
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Input Section */}
              <div style={{ background: '#fafafa', padding: 8, borderRadius: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                   <Text type="secondary" style={{ fontSize: 12 }}>输入数据</Text>
                </div>
                <pre style={{ margin: 0, fontSize: 11, overflowX: 'auto', maxHeight: 100 }}>
                  {JSON.stringify(step.input, null, 2)}
                </pre>
              </div>

              {/* Output Section */}
              <div style={{ background: '#f6ffed', padding: 8, borderRadius: 4, border: '1px solid #b7eb8f' }}>
                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                   <Text type="success" style={{ fontSize: 12 }}>输出数据</Text>
                </div>
                {step.error ? (
                   <Text type="danger">{step.error}</Text>
                ) : (
                  <pre style={{ margin: 0, fontSize: 11, overflowX: 'auto', maxHeight: 150 }}>
                    {JSON.stringify(step.output, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </Panel>
        ))}
      </Collapse>

      )}
      {/* Final Output */}
      {result.finalOutput && (
        <Card size="small" title="最终输出" style={{ marginTop: 16, borderColor: '#1890ff' }}>
           <pre style={{ margin: 0, fontSize: 12, overflowX: 'auto' }}>
              {JSON.stringify(result.finalOutput, null, 2)}
           </pre>
        </Card>
      )}
    </div>
  );
};

export default VisualLog;
