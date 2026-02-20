import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, Typography } from 'antd';
import { LoginOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default memo(({ data, isConnectable }: any) => {
  return (
    <Card 
      size="small" 
      title={<><LoginOutlined style={{ color: '#faad14', marginRight: 8 }} /> 输入</>} 
      style={{ width: 180, borderColor: '#fffbe6', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      headStyle={{ backgroundColor: '#fffbe6', borderBottom: '1px solid #ffe58f', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
      bodyStyle={{ padding: '12px 16px', backgroundColor: '#fff', borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}
      hoverable
    >
      <div>
        <Text strong style={{ fontSize: 14 }}>{data.label}</Text>
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
