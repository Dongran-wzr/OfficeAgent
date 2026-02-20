import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  Connection,
  ReactFlowInstance,
  NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Layout, Button, Drawer, Input, message, Spin, Form, Select, Card, Typography } from 'antd';
import { PlayCircleOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

import Sidebar from '../components/Sidebar';
import LLMNode from '../components/nodes/LLMNode';
import ToolNode from '../components/nodes/ToolNode';
import InputNode from '../components/nodes/InputNode';
import OutputNode from '../components/nodes/OutputNode';

const { Header, Content, Sider } = Layout;
const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

const nodeTypes = {
  llm: LLMNode,
  tool: ToolNode,
  input: InputNode,
  output: OutputNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: '输入' },
    position: { x: 250, y: 5 },
  },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

const WorkflowEditor = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  // Config Drawer State
  const [configDrawerVisible, setConfigDrawerVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [form] = Form.useForm();

  const [debugInput, setDebugInput] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `${label}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setConfigDrawerVisible(true);
      form.setFieldsValue(node.data);
  }, [form]);

  const handleConfigSave = () => {
      if (!selectedNode) return;
      const values = form.getFieldsValue();
      
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                ...values,
              },
            };
          }
          return node;
        })
      );
      
      message.success('节点配置已更新');
      setConfigDrawerVisible(false);
  };

  const renderConfigForm = () => {
      if (!selectedNode) return null;

      switch (selectedNode.type) {
          case 'llm':
              return (
                  <>
                      <Form.Item name="label" label="节点名称">
                          <Input />
                      </Form.Item>
                      <Form.Item name="model" label="模型选择">
                          <Select>
                              <Option value="DeepSeek">DeepSeek</Option>
                              <Option value="通义千问">通义千问</Option>
                          </Select>
                      </Form.Item>
                      <Form.Item name="prompt" label="提示词模板">
                          <TextArea rows={6} placeholder="输入提示词，使用 {{input}} 引用上游输入" />
                      </Form.Item>
                  </>
              );
          case 'tool':
               return (
                  <>
                      <Form.Item name="label" label="节点名称">
                          <Input />
                      </Form.Item>
                       <Form.Item name="toolType" label="工具类型" initialValue="audio_synthesis">
                          <Select disabled>
                              <Option value="audio_synthesis">超拟人音频合成</Option>
                          </Select>
                      </Form.Item>
                  </>
              );
          default:
              return (
                  <Form.Item name="label" label="节点名称">
                      <Input />
                  </Form.Item>
              );
      }
  };

  const handleSave = () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      console.log('Flow saved:', flow);
      message.success('工作流配置已保存 (Mock)');
      // TODO: Call backend API to save
    }
  };

  const handleDebug = async () => {
      setLoading(true);
      setDebugLog(['开始执行工作流...']);
      setAudioUrl(null);
      
      try {
          // Mock Execution for now, waiting for backend integration
          setTimeout(() => {
              setDebugLog(prev => [...prev, `[Input] 接收输入: ${debugInput}`]);
              setDebugLog(prev => [...prev, `[DeepSeek] 思考中...`]);
              setDebugLog(prev => [...prev, `[DeepSeek] 输出: 这是一个关于"${debugInput}"的精彩故事...`]);
              setDebugLog(prev => [...prev, `[Audio] 正在合成音频...`]);
              
              const mockAudio = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; // Mock Audio
              setAudioUrl(mockAudio);
              setDebugLog(prev => [...prev, `[Output] 执行完成`]);
              setLoading(false);
          }, 2000);
          
          // TODO: Call backend execute API
          /*
          const response = await axios.post('/api/workflow/execute', {
              input: debugInput,
              graph: reactFlowInstance?.toObject()
          });
          */

      } catch (error) {
          console.error(error);
          setDebugLog(prev => [...prev, `[Error] 执行失败`]);
          setLoading(false);
      }
  };

  return (
    <div className="dndflow" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>OfficeAgent Workflow</div>
            <div>
                <Button icon={<SaveOutlined />} onClick={handleSave} style={{ marginRight: 10 }}>保存</Button>
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setDrawerVisible(true)}>调试</Button>
            </div>
        </Header>
      <ReactFlowProvider>
        <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ flex: 1, display: 'flex' }}>
            <Sidebar />
            <div style={{ flex: 1, height: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    defaultEdgeOptions={{ animated: true, style: { stroke: '#b1b1b7', strokeWidth: 2 } }}
                >
                    <Controls />
                    <MiniMap />
                    <Background gap={12} size={1} color="#aaa" />
                </ReactFlow>
            </div>
        </div>
      </ReactFlowProvider>
      
      {/* Debug Drawer */}
      <Drawer
        title="调试面板"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
      >
          <div style={{ marginBottom: 20 }}>
              <h4>用户输入</h4>
              <TextArea 
                rows={4} 
                value={debugInput} 
                onChange={e => setDebugInput(e.target.value)} 
                placeholder="请输入测试内容..." 
              />
              <Button type="primary" block style={{ marginTop: 10 }} onClick={handleDebug} loading={loading}>
                  开始执行
              </Button>
          </div>
          
          <div style={{ marginBottom: 20 }}>
              <h4>执行日志</h4>
              <div style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, minHeight: 150, maxHeight: 300, overflowY: 'auto' }}>
                  {debugLog.map((log, index) => (
                      <div key={index} style={{ marginBottom: 5, fontSize: 12 }}>{log}</div>
                  ))}
              </div>
          </div>
          
          {audioUrl && (
              <div>
                  <h4>生成的播客</h4>
                  <audio controls src={audioUrl} style={{ width: '100%' }}>
                      您的浏览器不支持 audio 元素。
                  </audio>
              </div>
          )}
      </Drawer>

      {/* Configuration Drawer */}
      <Drawer
          title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                  <SettingOutlined style={{ marginRight: 8 }} />
                  <span>节点配置</span>
              </div>
          }
          placement="right"
          onClose={() => setConfigDrawerVisible(false)}
          open={configDrawerVisible}
          width={400}
          mask={false}
          extra={
              <Button type="primary" onClick={handleConfigSave}>
                  应用
              </Button>
          }
      >
          <Form
              form={form}
              layout="vertical"
              initialValues={selectedNode?.data}
          >
              <div style={{ marginBottom: 20 }}>
                   <Title level={5}>节点 ID: {selectedNode?.id}</Title>
                   <Title level={5} type="secondary" style={{ marginTop: 0 }}>类型: {selectedNode?.type}</Title>
              </div>
              
              {renderConfigForm()}
          </Form>
      </Drawer>
    </div>
  );
};

export default WorkflowEditor;
