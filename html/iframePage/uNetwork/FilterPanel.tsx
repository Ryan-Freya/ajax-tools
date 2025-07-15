import React, { useState } from 'react';
import { 
  Card, 
  Radio, 
  Button, 
  Space, 
  Input, 
  Switch, 
  Popconfirm, 
  Tag, 
  message,
  Collapse,
  Select
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  FilterOutlined 
} from '@ant-design/icons';

const { Option } = Select;

export interface FilterRule {
  id: string;
  pattern: string;
  description: string;
  enabled: boolean;
  type: 'regex' | 'string';
}

export interface FilterConfig {
  mode: 'include' | 'exclude';
  rules: FilterRule[];
}

interface FilterPanelProps {
  visible: boolean;
  onToggle: () => void;
  config: FilterConfig;
  onChange: (config: FilterConfig) => void;
  requestsCount: number;
  filteredCount: number;
  onPreview: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  visible,
  onToggle,
  config,
  onChange,
  requestsCount,
  filteredCount,
  onPreview
}) => {
  const [newRule, setNewRule] = useState<Partial<FilterRule>>({
    pattern: '',
    description: '',
    type: 'string'
  });

  // 预设模板
  const templates = [
    {
      name: 'API接口',
      description: '只导出API相关接口',
      rules: [
        { pattern: '/api/', description: 'API路径', type: 'string' as const },
        { pattern: '/v[0-9]+/', description: 'API版本', type: 'regex' as const }
      ]
    },
    {
      name: '排除静态资源',
      description: '排除图片、CSS、JS等静态文件',
      mode: 'exclude' as const,
      rules: [
        { pattern: '\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$', description: '静态资源文件', type: 'regex' as const }
      ]
    }
  ];

  const addRule = () => {
    if (!newRule.pattern?.trim()) {
      message.warning('请输入URL匹配模式');
      return;
    }

    const rule: FilterRule = {
      id: Date.now().toString(),
      pattern: newRule.pattern.trim(),
      description: newRule.description?.trim() || '',
      enabled: true,
      type: newRule.type || 'string'
    };

    onChange({
      ...config,
      rules: [...config.rules, rule]
    });

    setNewRule({ pattern: '', description: '', type: 'string' });
    message.success('规则添加成功');
  };

  const removeRule = (id: string) => {
    onChange({
      ...config,
      rules: config.rules.filter(rule => rule.id !== id)
    });
    message.success('规则删除成功');
  };

  const updateRule = (id: string, updates: Partial<FilterRule>) => {
    onChange({
      ...config,
      rules: config.rules.map(rule => 
        rule.id === id ? { ...rule, ...updates } : rule
      )
    });
  };

  const applyTemplate = (template: typeof templates[0]) => {
    const newRules = template.rules.map(rule => ({
      id: Date.now().toString() + Math.random(),
      pattern: rule.pattern,
      description: rule.description,
      enabled: true,
      type: rule.type
    }));

    onChange({
      mode: template.mode || config.mode,
      rules: [...config.rules, ...newRules]
    });

    message.success(`已应用模板: ${template.name}`);
  };

  const clearAllRules = () => {
    onChange({
      ...config,
      rules: []
    });
    message.success('已清空所有规则');
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Button
        type="text"
        icon={<FilterOutlined />}
        onClick={onToggle}
        style={{ marginBottom: visible ? 8 : 0 }}
      >
        过滤设置 {config.rules.length > 0 && `(${config.rules.length}条规则)`}
      </Button>

      {visible && (
        <Card size="small" style={{ backgroundColor: '#fafafa' }}>
          {/* 过滤模式选择 */}
          <div style={{ marginBottom: 16 }}>
            <Space align="center">
              <span>过滤模式:</span>
              <Radio.Group
                value={config.mode}
                onChange={(e) => onChange({ ...config, mode: e.target.value })}
              >
                <Radio value="include">包含模式 (只导出匹配的URL)</Radio>
                <Radio value="exclude">排除模式 (排除匹配的URL)</Radio>
              </Radio.Group>
            </Space>
          </div>

          {/* 统计信息 */}
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Tag color="blue">总请求: {requestsCount}</Tag>
              <Tag color={filteredCount > 0 ? "green" : "orange"}>
                将导出: {filteredCount}
              </Tag>
              {filteredCount !== requestsCount && (
                <Tag color="red">过滤掉: {requestsCount - filteredCount}</Tag>
              )}
            </Space>
          </div>

          {/* 添加新规则 */}
          <Card size="small" title="添加过滤规则" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>URL匹配模式</div>
                <Input
                  placeholder="例如: /api/ 或 .*\.json$"
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                  onPressEnter={addRule}
                />
              </div>
              <div style={{ width: 100 }}>
                <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>匹配类型</div>
                <Select
                  value={newRule.type}
                  onChange={(value) => setNewRule({ ...newRule, type: value })}
                  style={{ width: '100%' }}
                >
                  <Option value="string">字符串</Option>
                  <Option value="regex">正则表达式</Option>
                </Select>
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>描述 (可选)</div>
                <Input
                  placeholder="规则描述"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  onPressEnter={addRule}
                />
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={addRule}>
                添加
              </Button>
            </div>
          </Card>

          {/* 规则列表 */}
          {config.rules.length > 0 && (
            <Card 
              size="small" 
              title={
                <Space>
                  <span>过滤规则列表</span>
                  <Popconfirm
                    title="确定要清空所有规则吗？"
                    onConfirm={clearAllRules}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button size="small" danger>清空所有</Button>
                  </Popconfirm>
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {config.rules.map((rule) => (
                  <div key={rule.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: 8, 
                    backgroundColor: rule.enabled ? '#f6ffed' : '#f5f5f5',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4 
                  }}>
                    <Switch
                      size="small"
                      checked={rule.enabled}
                      onChange={(checked) => updateRule(rule.id, { enabled: checked })}
                      style={{ marginRight: 8 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
                        <Tag color={rule.type === 'regex' ? 'orange' : 'blue'} size="small">
                          {rule.type === 'regex' ? '正则' : '字符串'}
                        </Tag>
                        {rule.pattern}
                      </div>
                      {rule.description && (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                          {rule.description}
                        </div>
                      )}
                    </div>
                    <Popconfirm
                      title="确定要删除这条规则吗？"
                      onConfirm={() => removeRule(rule.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button 
                        type="text" 
                        size="small" 
                        danger 
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </div>
                ))}
              </Space>
            </Card>
          )}

          {/* 操作按钮 */}
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button icon={<EyeOutlined />} onClick={onPreview}>
                预览导出数据
              </Button>
            </Space>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FilterPanel; 