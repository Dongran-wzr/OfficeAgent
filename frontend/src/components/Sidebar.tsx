import React, { DragEvent } from 'react';
import { Card, Collapse } from 'antd';
import { RobotOutlined, ToolOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

export default function Sidebar() {
  const onDragStart = (event: DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{ width: 250, padding: 15, borderRight: '1px solid #eee', background: '#fcfcfc' }}>
      <h3>节点库</h3>
      <Collapse defaultActiveKey={['1', '2', '3']}>
        <Panel header="基础节点" key="1">
           <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'input', '输入')} draggable>
            <Card size="small" hoverable><LoginOutlined /> 输入</Card>
          </div>
          <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'output', '输出')} draggable style={{ marginTop: 10 }}>
             <Card size="small" hoverable><LogoutOutlined /> 输出</Card>
          </div>
        </Panel>
        <Panel header="大模型节点" key="2">
          <div className="dndnode" onDragStart={(event) => onDragStart(event, 'llm', 'DeepSeek')} draggable>
             <Card size="small" hoverable><RobotOutlined /> DeepSeek</Card>
          </div>
           <div className="dndnode" onDragStart={(event) => onDragStart(event, 'llm', '通义千问')} draggable style={{ marginTop: 10 }}>
             <Card size="small" hoverable><RobotOutlined /> 通义千问</Card>
          </div>
        </Panel>
        <Panel header="工具节点" key="3">
          <div className="dndnode" onDragStart={(event) => onDragStart(event, 'tool', '超拟人音频合成')} draggable>
             <Card size="small" hoverable><ToolOutlined /> 超拟人音频合成</Card>
          </div>
        </Panel>
      </Collapse>
    </aside>
  );
};
