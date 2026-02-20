import React, { DragEvent } from 'react';
import { Card, Collapse, Typography, Tag, Space } from 'antd';
import { 
  RobotOutlined, 
  ToolOutlined, 
  LoginOutlined, 
  LogoutOutlined,
  BulbOutlined,
  ApiOutlined,
  SoundOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

const { Panel } = Collapse;
const { Title, Text } = Typography;

export default function Sidebar() {
  const onDragStart = (event: DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const getNodeCard = (icon: React.ReactNode, title: string, description: string, type: string, label: string, color: string) => (
    <div 
      className="dndnode" 
      onDragStart={(event) => onDragStart(event, type, label)} 
      draggable
      style={{ marginBottom: 12 }}
    >
      <Card 
        size="small" 
        hoverable
        style={{
          borderRadius: 10,
          border: `1px solid ${color}20`,
          background: `linear-gradient(135deg, ${color}05 0%, ${color}10 100%)`,
          transition: 'all 0.3s ease',
          cursor: 'grab'
        }}
        bodyStyle={{ padding: '16px' }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = `0 8px 25px ${color}30`;
          e.currentTarget.style.border = `1px solid ${color}40`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          e.currentTarget.style.border = `1px solid ${color}20`;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ 
            fontSize: 22, 
            color: color,
            background: `${color}15`,
            borderRadius: 8,
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <Text strong style={{ 
              fontSize: 14, 
              color: '#333',
              display: 'block',
              marginBottom: 4
            }}>
              {title}
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: '#666',
              lineHeight: 1.4
            }}>
              {description}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Tag color={color} style={{ fontSize: 10, padding: '0 6px', height: 20 }}>
                {type.toUpperCase()}
              </Tag>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <aside style={{ 
      width: 280, 
      padding: 20, 
      borderRight: '1px solid #e8e8e8', 
      background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
      height: '100%',
      boxShadow: '2px 0 12px rgba(0,0,0,0.05)'
    }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ 
          fontSize: 28, 
          color: '#1890ff',
          marginBottom: 8
        }}>
          <BulbOutlined />
        </div>
        <Title level={4} style={{ 
          margin: 0, 
          color: '#333',
          fontWeight: 600
        }}>
          节点库
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          拖拽节点到画布构建工作流
        </Text>
      </div>

      <Collapse 
        defaultActiveKey={['1', '2', '3']}
        ghost
        expandIconPosition="end"
        style={{ background: 'transparent' }}
      >
        <Panel 
          header={
            <Space>
              <DatabaseOutlined style={{ color: '#52c41a' }} />
              <span style={{ fontWeight: 500 }}>基础节点</span>
              <Tag color="#52c41a" style={{ fontSize: 10 }}>2</Tag>
            </Space>
          } 
          key="1"
          style={{ 
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 8,
            marginBottom: 12,
            border: '1px solid #f0f0f0'
          }}
        >
          {getNodeCard(
            <LoginOutlined />,
            '输入节点',
            '接收用户输入数据，作为工作流的起点',
            'input',
            '输入',
            '#52c41a'
          )}
          {getNodeCard(
            <LogoutOutlined />,
            '输出节点',
            '输出最终结果，完成工作流执行',
            'output',
            '输出',
            '#eb2f96'
          )}
        </Panel>

        <Panel 
          header={
            <Space>
              <RobotOutlined style={{ color: '#722ed1' }} />
              <span style={{ fontWeight: 500 }}>大模型节点</span>
              <Tag color="#722ed1" style={{ fontSize: 10 }}>2</Tag>
            </Space>
          } 
          key="2"
          style={{ 
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 8,
            marginBottom: 12,
            border: '1px solid #f0f0f0'
          }}
        >
          {getNodeCard(
            <RobotOutlined />,
            'DeepSeek',
            '深度求索大语言模型，处理复杂文本任务',
            'llm',
            'DeepSeek',
            '#722ed1'
          )}
          {getNodeCard(
            <ApiOutlined />,
            '通义千问',
            '阿里巴巴通义千问大模型，多语言理解',
            'llm',
            '通义千问',
            '#1890ff'
          )}
        </Panel>

        <Panel 
          header={
            <Space>
              <ToolOutlined style={{ color: '#fa8c16' }} />
              <span style={{ fontWeight: 500 }}>工具节点</span>
              <Tag color="#fa8c16" style={{ fontSize: 10 }}>1</Tag>
            </Space>
          } 
          key="3"
          style={{ 
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 8,
            border: '1px solid #f0f0f0'
          }}
        >
          {getNodeCard(
            <SoundOutlined />,
            '超拟人音频合成',
            '将文本转换为自然流畅的语音输出',
            'tool',
            '超拟人音频合成',
            '#fa8c16'
          )}
        </Panel>
      </Collapse>

      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
        borderRadius: 8,
        border: '1px solid #91d5ff'
      }}>
        <Text strong style={{ 
          fontSize: 13, 
          color: '#1890ff',
          display: 'block',
          marginBottom: 8
        }}>
          💡 使用提示
        </Text>
        <Text style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
          拖拽节点到画布空白区域即可添加，通过连线连接节点构建完整的工作流。
        </Text>
      </div>
    </aside>
  );
};