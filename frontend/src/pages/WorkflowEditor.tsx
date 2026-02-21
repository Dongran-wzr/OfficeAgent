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
import { Layout, Button, Drawer, Input, message, Spin, Form, Select, Card, Typography, Checkbox, Space, Modal } from 'antd';
import { PlayCircleOutlined, SaveOutlined, SettingOutlined, FolderOpenOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

import Sidebar from '../components/Sidebar';
import LLMNode from '../components/nodes/LLMNode';
import ToolNode from '../components/nodes/ToolNode';
import InputNode from '../components/nodes/InputNode';
import OutputNode from '../components/nodes/OutputNode';
import VisualLog from '../components/VisualLog';

import { saveWorkflow, workflowApi, API_BASE_URL } from '../utils/api';

const { Header, Content, Sider } = Layout;
const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

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

  // Load Drawer State
  const [loadDrawerVisible, setLoadDrawerVisible] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);

  // Save Modal State
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const [debugInput, setDebugInput] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [executionResult, setExecutionResult] = useState(null);
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

  const handleSaveClick = () => {
      setSaveModalVisible(true);
  };

  const handleSaveConfirm = async () => {
    try {
      const values = await saveForm.validateFields();
      if (reactFlowInstance) {
        setSaving(true);
        const flow = reactFlowInstance.toObject();
        console.log('Saving flow:', flow);
        
        const workflowData = {
          name: values.name,
          description: values.description,
          graphData: JSON.stringify(flow)
        };

        const result = await saveWorkflow(workflowData);
        console.log('Save result:', result);
        message.success('工作流已成功保存到数据库！');
        setSaveModalVisible(false);
        saveForm.resetFields();
      }
    } catch (error) {
      console.error('Save failed:', error);
      message.error('保存失败：' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadWorkflows = async () => {
    try {
      setLoadingWorkflows(true);
      const response = await workflowApi.list();
      setSavedWorkflows(response.data);
      setLoadingWorkflows(false);
    } catch (error) {
      console.error('Load workflows failed:', error);
      message.error('加载工作流列表失败');
      setLoadingWorkflows(false);
    }
  };

  const handleLoadWorkflow = (workflow: any) => {
    try {
      const flow = JSON.parse(workflow.graphData);
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      setLoadDrawerVisible(false);
      message.success('工作流加载成功！');
    } catch (error) {
      console.error('Load workflow failed:', error);
      message.error('加载工作流失败');
    }
  };

  // Helper to get available variables from previous nodes (mock implementation)
  const getAvailableVariables = () => {
    // In a real implementation, traverse graph to find upstream nodes
    return nodes
        .filter(n => n.id !== selectedNode?.id)
        .map(n => ({
            label: `${n.data.label} (${n.id})`,
            value: `{{${n.id}.output}}` // Example format
        }));
  };

  const renderConfigForm = () => {
      if (!selectedNode) return null;

      switch (selectedNode.type) {
          case 'input':
              return (
                <>
                  <Form.Item name="label" label="节点名称">
                    <Input />
                  </Form.Item>
                  <Card size="small" title="参数配置" style={{ background: '#fafafa' }}>
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>变量名: </Text> <Text code>user_input</Text>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>变量类型: </Text> <Text code>String</Text>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <Text strong>描述: </Text> 用户本轮的输入内容
                    </div>
                    <div>
                       <Checkbox checked disabled>是否必要</Checkbox>
                    </div>
                  </Card>
                </>
              );
          case 'output':
              return (
                <>
                  <Form.Item name="label" label="节点名称">
                    <Input />
                  </Form.Item>
                  
                  <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text strong>输出配置</Text>
                      </div>
                      <Form.List name="outputParams">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }, index) => (
                              <Card key={key} size="small" style={{ marginBottom: 8, background: '#f9f9f9' }}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>参数 #{index + 1}</Text>
                                        <DeleteOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                                    </div>
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'name']}
                                      label="参数名"
                                      rules={[{ required: true, message: '请输入参数名' }]}
                                      style={{ marginBottom: 8 }}
                                    >
                                      <Input placeholder="例如: audio_url" />
                                    </Form.Item>
                                    
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'type']}
                                      label="参数类型"
                                      initialValue="input"
                                      style={{ marginBottom: 8 }}
                                    >
                                       <Select>
                                           <Option value="input">手动输入</Option>
                                           <Option value="reference">引用</Option>
                                       </Select>
                                    </Form.Item>

                                    <Form.Item
                                      noStyle
                                      shouldUpdate={(prevValues, currentValues) => {
                                          const prevType = prevValues.outputParams?.[name]?.type;
                                          const currType = currentValues.outputParams?.[name]?.type;
                                          return prevType !== currType;
                                      }}
                                    >
                                      {({ getFieldValue }) => {
                                          const type = getFieldValue(['outputParams', name, 'type']);
                                          return type === 'reference' ? (
                                              <Form.Item
                                                  {...restField}
                                                  name={[name, 'value']}
                                                  label="引用变量"
                                                  style={{ marginBottom: 0 }}
                                              >
                                                  <Select placeholder="选择变量">
                                                      {getAvailableVariables().map(v => (
                                                          <Option key={v.value} value={v.value}>{v.label}</Option>
                                                      ))}
                                                  </Select>
                                              </Form.Item>
                                          ) : (
                                              <Form.Item
                                                  {...restField}
                                                  name={[name, 'value']}
                                                  label="参数值"
                                                  style={{ marginBottom: 0 }}
                                              >
                                                  <Input placeholder="请输入值" />
                                              </Form.Item>
                                          );
                                      }}
                                    </Form.Item>
                                </Space>
                              </Card>
                            ))}
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                              添加输出参数
                            </Button>
                          </>
                        )}
                      </Form.List>
                  </div>

                  <Form.Item name="responseTemplate" label="回答内容配置">
                      <TextArea 
                          rows={6} 
                          placeholder="输入回答内容，可使用 {{参数名}} 引用上方配置的参数" 
                      />
                  </Form.Item>
                </>
              );
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
                      
                      <Card size="small" title="API 配置" style={{ marginBottom: 24, background: '#fafafa' }}>
                          <Form.Item 
                              name="apiBaseUrl" 
                              label="API 地址" 
                              rules={[{ required: true, message: '请输入 API 地址' }]}
                              initialValue="https://api.deepseek.com"
                          >
                              <Input placeholder="例如: https://api.deepseek.com" />
                          </Form.Item>
                          <Form.Item 
                              name="apiKey" 
                              label="API 密钥"
                              rules={[{ required: true, message: '请输入 API 密钥' }]}
                          >
                              <Input.Password placeholder="请输入 API Key" />
                          </Form.Item>
                          <Form.Item 
                              name="temperature" 
                              label="温度 (Temperature)" 
                              initialValue={0.7}
                          >
                              <Input type="number" step={0.1} min={0} max={2} />
                          </Form.Item>
                      </Card>

                      {/* Input Parameters Configuration */}
                      <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <Text strong>输入参数配置</Text>
                          </div>
                          <Form.List name="inputParams">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                  <Card key={key} size="small" style={{ marginBottom: 8, background: '#f9f9f9' }}>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>输入参数 #{index + 1}</Text>
                                            <DeleteOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                                        </div>
                                        <Form.Item
                                          {...restField}
                                          name={[name, 'name']}
                                          label="参数名"
                                          rules={[{ required: true, message: '请输入参数名' }]}
                                          style={{ marginBottom: 8 }}
                                        >
                                          <Input placeholder="例如: topic" />
                                        </Form.Item>
                                        
                                        <Form.Item
                                          {...restField}
                                          name={[name, 'type']}
                                          label="参数类型"
                                          initialValue="input"
                                          style={{ marginBottom: 8 }}
                                        >
                                           <Select>
                                               <Option value="input">手动输入</Option>
                                               <Option value="reference">引用</Option>
                                           </Select>
                                        </Form.Item>

                                        <Form.Item
                                          noStyle
                                          shouldUpdate={(prevValues, currentValues) => {
                                              const prevType = prevValues.inputParams?.[name]?.type;
                                              const currType = currentValues.inputParams?.[name]?.type;
                                              return prevType !== currType;
                                          }}
                                        >
                                          {({ getFieldValue }) => {
                                              const type = getFieldValue(['inputParams', name, 'type']);
                                              return type === 'reference' ? (
                                                  <Form.Item
                                                      {...restField}
                                                      name={[name, 'value']}
                                                      label="引用变量"
                                                      style={{ marginBottom: 0 }}
                                                  >
                                                      <Select placeholder="选择变量">
                                                          {getAvailableVariables().map(v => (
                                                              <Option key={v.value} value={v.value}>{v.label}</Option>
                                                          ))}
                                                      </Select>
                                                  </Form.Item>
                                              ) : (
                                                  <Form.Item
                                                      {...restField}
                                                      name={[name, 'value']}
                                                      label="参数值"
                                                      style={{ marginBottom: 0 }}
                                                  >
                                                      <Input placeholder="请输入值" />
                                                  </Form.Item>
                                              );
                                          }}
                                        </Form.Item>
                                    </Space>
                                  </Card>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                  添加输入参数
                                </Button>
                              </>
                            )}
                          </Form.List>
                      </div>

                      {/* Output Parameters Configuration */}
                      <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <Text strong>输出参数配置</Text>
                          </div>
                          <Form.List name="outputParams">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                  <Card key={key} size="small" style={{ marginBottom: 8, background: '#f9f9f9' }}>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>输出变量 #{index + 1}</Text>
                                            <DeleteOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                                        </div>
                                        <Form.Item
                                          {...restField}
                                          name={[name, 'name']}
                                          label="变量名"
                                          rules={[{ required: true, message: '请输入变量名' }]}
                                          style={{ marginBottom: 8 }}
                                        >
                                          <Input placeholder="例如: generated_text" />
                                        </Form.Item>
                                        
                                        <Form.Item
                                          {...restField}
                                          name={[name, 'type']}
                                          label="变量类型"
                                          initialValue="string"
                                          style={{ marginBottom: 8 }}
                                        >
                                           <Select disabled>
                                               <Option value="string">String</Option>
                                           </Select>
                                        </Form.Item>

                                        <Form.Item
                                          {...restField}
                                          name={[name, 'description']}
                                          label="描述"
                                          style={{ marginBottom: 0 }}
                                        >
                                          <Input placeholder="变量描述（可选）" />
                                        </Form.Item>
                                    </Space>
                                  </Card>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                  添加输出变量
                                </Button>
                              </>
                            )}
                          </Form.List>
                      </div>

                      <Form.Item name="prompt" label="提示词模板">
                          <TextArea rows={6} placeholder="输入提示词，使用 {{input}} 或 {{参数名}} 引用参数" />
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
                      
                      <Card size="small" title="API 配置" style={{ marginBottom: 24, background: '#fafafa' }}>
                           <Form.Item 
                               name="apiKey" 
                               label="API Key" 
                               rules={[{ required: true, message: '请输入 API Key' }]}
                           >
                               <Input.Password placeholder="请输入 API Key" />
                           </Form.Item>
                           <Form.Item 
                              name="model" 
                              label="模型名称" 
                              initialValue="qwen3-tts-flash"
                              rules={[{ required: true, message: '请输入模型名称' }]}
                          >
                              <Input placeholder="例如: qwen3-tts-flash" />
                          </Form.Item>
                       </Card>

                      <Card size="small" title="输入参数配置" style={{ marginBottom: 24, background: '#fafafa' }}>
                          <Form.Item
                              name="textType"
                              label="文本 (text) 类型"
                              initialValue="input"
                              style={{ marginBottom: 8 }}
                          >
                              <Select>
                                  <Option value="input">手动输入</Option>
                                  <Option value="reference">引用变量</Option>
                              </Select>
                          </Form.Item>
                          <Form.Item
                              noStyle
                              shouldUpdate={(prevValues, currentValues) => prevValues.textType !== currentValues.textType}
                          >
                              {({ getFieldValue }) => 
                                  getFieldValue('textType') === 'reference' ? (
                                      <Form.Item name="text" label="文本 (text) 值" rules={[{ required: true, message: '请选择引用变量' }]}>
                                          <Select placeholder="选择上游输出">
                                              {getAvailableVariables().map(v => (
                                                  <Option key={v.value} value={v.value}>{v.label}</Option>
                                              ))}
                                          </Select>
                                      </Form.Item>
                                  ) : (
                                      <Form.Item name="text" label="文本 (text) 值" rules={[{ required: true, message: '请输入文本' }]}>
                                          <TextArea rows={4} placeholder="请输入要合成的文本" />
                                      </Form.Item>
                                  )
                              }
                          </Form.Item>

                          <Form.Item
                              name="voice"
                              label="音色 (voice)"
                              initialValue="Cherry"
                          >
                              <Select>
                                  <Option value="Cherry">Cherry</Option>
                                  <Option value="Serena">Serena</Option>
                                  <Option value="Ethan">Ethan</Option>
                              </Select>
                          </Form.Item>
                          
                          <Form.Item
                              name="language_type"
                              label="语言类型 (language_type)"
                              initialValue="Auto"
                          >
                              <Select>
                                  <Option value="Auto">Auto</Option>
                              </Select>
                          </Form.Item>
                      </Card>

                      <Card size="small" title="输出参数配置" style={{ marginBottom: 24, background: '#fafafa' }}>
                           <Form.Item 
                               name="outputParams_voice_url_name" 
                               label="输出变量名" 
                               initialValue="voice_url"
                               rules={[{ required: true, message: '请输入变量名' }]}
                           >
                               <Input placeholder="例如: voice_url" disabled />
                           </Form.Item>
                           <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
                               类型: String (音频文件链接)
                           </div>
                           <Form.Item 
                               name="outputParams_voice_url_desc" 
                               label="描述" 
                           >
                               <Input placeholder="输出变量描述" />
                           </Form.Item>
                      </Card>
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



  const handleStreamEvent = (type: string, data: any) => {
      setExecutionResult((prev: any) => {
          // Initialize if null
          const currentResult = prev || {
              status: 'RUNNING',
              totalDuration: 0,
              steps: [],
              finalOutput: null
          };

          if (type === 'WORKFLOW_START') {
               return currentResult;
          }

          if (type === 'NODE_START') {
              // Check if step exists
              const exists = currentResult.steps.some((s: any) => s.nodeId === data.nodeId);
              if (!exists) {
                  return {
                      ...currentResult,
                      steps: [...currentResult.steps, {
                          nodeId: data.nodeId,
                          nodeName: data.nodeName,
                          nodeType: data.nodeType,
                          status: 'RUNNING',
                          duration: 0,
                          input: data.input || {}, 
                          output: null
                      }]
                  };
              }
              return currentResult;
          }

          if (type === 'NODE_END') {
              return {
                  ...currentResult,
                  steps: currentResult.steps.map((s: any) => 
                      s.nodeId === data.nodeId ? { ...s, ...data, status: 'SUCCESS' } : s
                  )
              };
          }

          if (type === 'WORKFLOW_END') {
              return data; // Replace with final result
          }

          if (type === 'ERROR') {
              return {
                  ...currentResult,
                  status: 'FAILED',
                  error: data
              };
          }

          return currentResult;
      });

      // Handle logs and audio
      if (type === 'NODE_START') {
          setDebugLog(prev => [...prev, `开始执行节点: ${data.nodeName} (${data.nodeType})`]);
      } else if (type === 'NODE_END') {
          setDebugLog(prev => [...prev, `节点执行完成: ${data.nodeName}`]);
          
          if (data.output) {
              if (data.output.voice_url) {
                  setAudioUrl(data.output.voice_url);
              } else {
                  // Fallback check
                  Object.values(data.output).forEach((val: any) => {
                       if (typeof val === 'string' && (val.endsWith('.mp3') || val.includes('/audio/'))) {
                           setAudioUrl(val);
                       }
                  });
              }
          }
      } else if (type === 'WORKFLOW_END') {
          if (data.finalOutput && data.finalOutput.voice_url) {
              setAudioUrl(data.finalOutput.voice_url);
          }
      } else if (type === 'ERROR') {
          setDebugLog(prev => [...prev, `[Error] ${data}`]);
      }
  };

  const handleDebug = async () => {
      setLoading(true);
      setDebugLog(['开始执行工作流...']);
      setAudioUrl(null);
      setExecutionResult(null);
      
      try {
          const payload = {
              input: { input: debugInput },
              graph: reactFlowInstance?.toObject()
          };

          const response = await fetch(`${API_BASE_URL}/execute/stream`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
          });

          if (!response.body) {
              throw new Error('ReadableStream not supported in this browser.');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n\n');
              buffer = lines.pop() || ''; 

              for (const line of lines) {
                  const eventMatch = line.match(/^event:(.*)$/m);
                  const dataMatch = line.match(/^data:(.*)$/m);
                  
                  if (eventMatch && dataMatch) {
                      const eventType = eventMatch[1].trim();
                      const eventDataStr = dataMatch[1].trim();
                      
                      try {
                          const eventData = JSON.parse(eventDataStr);
                          handleStreamEvent(eventType, eventData);
                      } catch (e) {
                          console.error('Error parsing SSE data:', e);
                      }
                  }
              }
          }

          setLoading(false);
          setDebugLog(prev => [...prev, '执行完成']);

      } catch (error) {
          console.error(error);
          setDebugLog(prev => [...prev, `[Error] 执行失败: ${(error as any).message}`]);
          setExecutionResult((prev: any) => prev ? { ...prev, status: 'FAILED', error: (error as any).message } : null);
          setLoading(false);
      }
  };

  return (
    <div className="dndflow" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold' }}>OfficeAgent Workflow</div>
        <div>
          <Button icon={<SaveOutlined />} onClick={handleSaveClick} style={{ marginRight: 10 }}>保存</Button>
          <Button icon={<FolderOpenOutlined />} onClick={() => setLoadDrawerVisible(true)} style={{ marginRight: 10 }}>加载</Button>
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
      
      {/* Load Workflow Drawer */}
      <Drawer
        title="加载工作流"
        placement="right"
        onClose={() => setLoadDrawerVisible(false)}
        open={loadDrawerVisible}
        width={400}
      >
        <div style={{ marginBottom: 20 }}>
          <h4>已保存的工作流</h4>
          <div style={{ marginBottom: 10 }}>
            <Button 
              type="primary" 
              onClick={handleLoadWorkflows}
              loading={loadingWorkflows}
              block
            >
              刷新列表
            </Button>
          </div>
          <div style={{ 
            background: '#f5f5f5', 
            padding: 10, 
            borderRadius: 4, 
            minHeight: 200, 
            maxHeight: 300, 
            overflowY: 'auto' 
          }}>
            {savedWorkflows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                {loadingWorkflows ? '加载中...' : '暂无保存的工作流'}
              </div>
            ) : (
              savedWorkflows.map((workflow: any) => (
                <Card 
                  key={workflow.id} 
                  size="small" 
                  hoverable
                  style={{ marginBottom: 10 }}
                  onClick={() => handleLoadWorkflow(workflow)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{workflow.name || '未命名工作流'}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {workflow.description || '无描述'}
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                        创建时间: {new Date(workflow.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadWorkflow(workflow);
                      }}
                    >
                      加载
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </Drawer>

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
              <VisualLog result={executionResult} loading={loading} />
              {!executionResult && !loading && debugLog.length > 0 && (
                  <div style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, minHeight: 100, maxHeight: 200, overflowY: 'auto', marginTop: 10, fontSize: 12, color: '#999' }}>
                      {debugLog.map((log, index) => (
                          <div key={index}>{log}</div>
                      ))}
                  </div>
              )}
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

      {/* Save Workflow Modal */}
      <Modal
        title="保存工作流"
        open={saveModalVisible}
        onOk={handleSaveConfirm}
        onCancel={() => setSaveModalVisible(false)}
        confirmLoading={saving}
      >
        <Form
          form={saveForm}
          layout="vertical"
          initialValues={{ name: '未命名工作流' }}
        >
          <Form.Item
            name="name"
            label="工作流名称"
            rules={[{ required: true, message: '请输入工作流名称' }]}
          >
            <Input placeholder="请输入工作流名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={4} placeholder="请输入工作流描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkflowEditor;