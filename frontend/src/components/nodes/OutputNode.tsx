import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default memo(({ data, isConnectable }: any) => {
  return (
    <Card 
      size="small" 
      title={<><LogoutOutlined style={{ color: '#ff4d4f', marginRight: 8 }} /> 输出</>} 
      style={{ width: 180, borderColor: '#fff1f0', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      headStyle={{ backgroundColor: '#fff1f0', borderBottom: '1px solid #ffccc7', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
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
      </div>
    </Card>
  );
});
