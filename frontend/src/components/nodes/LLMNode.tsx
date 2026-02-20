import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default memo(({ data, isConnectable }: any) => {
  return (
    <Card 
      size="small" 
      title={<><RobotOutlined style={{ color: '#1890ff', marginRight: 8 }} /> 大模型节点</>} 
      style={{ width: 220, borderColor: '#e6f7ff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      headStyle={{ backgroundColor: '#e6f7ff', borderBottom: '1px solid #bae7ff', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
      bodyStyle={{ padding: '12px 16px', backgroundColor: '#fff', borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}
      hoverable
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555', width: 8, height: 8 }}
      />
      <div>
        <Text strong style={{ fontSize: 14 }}>{data.label}</Text>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{data.model || 'DeepSeek'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#555', width: 8, height: 8 }}
      />
    </Card>
  );
});
