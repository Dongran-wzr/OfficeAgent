import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, Typography } from 'antd';
import { AudioOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default memo(({ data, isConnectable }: any) => {
  return (
    <Card 
      size="small" 
      title={<><AudioOutlined style={{ color: '#52c41a', marginRight: 8 }} /> 音频合成</>} 
      style={{ width: 220, borderColor: '#f6ffed', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      headStyle={{ backgroundColor: '#f6ffed', borderBottom: '1px solid #b7eb8f', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
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
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Tool Node</div>
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
