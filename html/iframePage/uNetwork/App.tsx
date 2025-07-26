import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import { VTablePro } from 'virtualized-table';
import { Button, Input, Modal, Radio, Space, message } from 'antd';
import { FilterOutlined, PauseCircleFilled, PlayCircleTwoTone, StopOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import './App.css';
import RequestDrawer from './RequestDrawer';
import FilterPanel, { FilterConfig, FilterRule } from './FilterPanel';
import { defaultInterface, AjaxDataListObject, DefaultInterfaceObject } from '../common/value';
import { exportJSON } from '../main/utils/exportJson';

interface AddInterceptorParams {
  ajaxDataList: AjaxDataListObject[],
  iframeVisible?: boolean,
  groupIndex?: number,
  request: string,
  responseText: string
}

// 默认过滤配置
const defaultFilterConfig: FilterConfig = {
  mode: 'exclude',
  rules: [
    {
      id: 'default-1',
      pattern: '/Menu/GetMenuAllDataV2',
      description: '默认排除菜单数据接口',
      enabled: true,
      type: 'string'
    },
    {
      id: 'default-2', 
      pattern: '/File/GetComponentView',
      description: '默认排除组件视图接口',
      enabled: true,
      type: 'string'
    }
  ]
};

// 过滤逻辑函数
const applyFilter = (requests: any[], filterConfig: FilterConfig) => {
  if (!filterConfig.rules.length) {
    return requests; // 没有规则时返回所有请求
  }

  return requests.filter(request => {
    const url = request.request.url;
    const matchesAnyRule = filterConfig.rules
      .filter(rule => rule.enabled)
      .some(rule => {
        try {
          if (rule.type === 'regex') {
            return new RegExp(rule.pattern).test(url);
          } else {
            return url.includes(rule.pattern);
          }
        } catch (error) {
          console.warn('过滤规则错误:', rule.pattern, error);
          return false;
        }
      });
    
    // 包含模式：匹配则保留，排除模式：匹配则排除
    return filterConfig.mode === 'include' ? matchesAnyRule : !matchesAnyRule;
  });
};

// 新增：检查请求是否匹配过滤规则（用于样式显示）
const checkRequestMatchesFilterRules = (request: any, filterConfig: FilterConfig) => {
  if (!filterConfig.rules.length) {
    return false; // 没有规则时，不匹配任何规则
  }

  const url = request.request.url;
  return filterConfig.rules
    .filter(rule => rule.enabled)
    .some(rule => {
      try {
        if (rule.type === 'regex') {
          return new RegExp(rule.pattern).test(url);
        } else {
          return url.includes(rule.pattern);
        }
      } catch (error) {
        console.warn('过滤规则错误:', rule.pattern, error);
        return false;
      }
    });
};

const getColumns = ({
  onAddInterceptorClick,
  onRequestUrlClick,
  onAddToFilter,
  filterConfig,
  filteredRequestsForTable
} : {
  onAddInterceptorClick: (record: any) => void,
  onRequestUrlClick: (record: any) => void,
  onAddToFilter: (record: any) => void,
  filterConfig: FilterConfig,
  filteredRequestsForTable: any[],
}) => {

  return [
    {
      title: 'Index',
      dataIndex: 'Index',
      width: 60,
      align: 'center',
      render: (value: any, record: any, index: any, realIndex: number) => realIndex + 1,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
      style: { padding: '0 4px' },
      render: (value: any, record: { request: { url: string }; }) => {
        const name = record.request.url.match('[^/]+(?!.*/)');
        return <span
          className="ajax-tools-devtools-text-btn"
          title={record.request.url}
          onClick={() => onRequestUrlClick(record)}
        >
          {name && name[0]}
        </span>;
      }
    },
    {
      title: 'Method',
      dataIndex: 'method',
      width: 60,
      align: 'center',
      render: (value: any, record: { request: { method: string }; }) => record.request.method,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 60,
      align: 'center',
      render: (value: any, record: { response: { status: string }; }) => record.response.status,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 60,
      align: 'center',
      render: (value: any, record: { _resourceType: string; }) => record._resourceType,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 90,
      align: 'center',
      render: (value: any, record: any) => {
        const content = (
          <Space size="small">
            <FilterOutlined
              className="ajax-tools-devtools-text-btn"
              title="Add request to be intercepted"
              onClick={() => onAddInterceptorClick(record)}
            />
            <PlusOutlined
              className="ajax-tools-devtools-text-btn"
              title="添加到过滤器"
              onClick={() => onAddToFilter(record)}
            />
          </Space>
        );
        return content;
      }
    }
  ];
};

// "/^t.*$/" or "^t.*$" => new RegExp
const strToRegExp = (regStr: string) => {
  let regexp = new RegExp('');
  try {
    const regParts = regStr.match(new RegExp('^/(.*?)/([gims]*)$'));
    if (regParts) {
      regexp = new RegExp(regParts[1], regParts[2]);
    } else {
      regexp = new RegExp(regStr);
    }
  } catch (error) {
    console.error(error);
  }
  return regexp;
};

// 生成模拟的网络请求数据
const generateMockNetworkData = () => {
  const mockRequests = [
    {
      _resourceType: 'fetch',
      request: {
        url: 'http://localhost:4001/api/users',
        method: 'GET'
      },
      response: {
        status: '200',
        bodySize: 156
      },
      getContent: (callback: (content: string) => void) => {
        callback(JSON.stringify([
          { id: 1, name: '张三', email: 'zhangsan@example.com' },
          { id: 2, name: '李四', email: 'lisi@example.com' }
        ]));
      }
    },
    {
      _resourceType: 'fetch',
      request: {
        url: 'http://localhost:4001/api/products?page=1&limit=5',
        method: 'GET'
      },
      response: {
        status: '200',
        bodySize: 425
      },
      getContent: (callback: (content: string) => void) => {
        callback(JSON.stringify({
          data: Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            name: `商品${i + 1}`,
            price: Math.floor(Math.random() * 1000) + 100
          })),
          pagination: {
            page: 1,
            limit: 5,
            total: 100
          }
        }));
      }
    },
    {
      _resourceType: 'fetch',
      request: {
        url: 'http://localhost:4001/api/users/1',
        method: 'GET'
      },
      response: {
        status: '200',
        bodySize: 198
      },
      getContent: (callback: (content: string) => void) => {
        callback(JSON.stringify({
          id: 1,
          name: '用户1',
          email: 'user1@example.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
          createdAt: new Date().toISOString()
        }));
      }
    },
    {
      _resourceType: 'fetch',
      request: {
        url: 'http://localhost:4001/api/login',
        method: 'POST'
      },
      response: {
        status: '200',
        bodySize: 89
      },
      getContent: (callback: (content: string) => void) => {
        callback(JSON.stringify({
          token: 'mock-token-' + Date.now(),
          user: { 
            id: 1, 
            username: 'admin',
            role: 'administrator'
          }
        }));
      }
    }
  ];
  return mockRequests;
};

const App = () => {
  const requestFinishedRef = useRef<any>(null);
  const [recording, setRecording] = useState(false);
  const [uNetwork, setUNetwork] = useState<any[]>([]);
  const [filterKey, setFilterKey] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currRecord, setCurrRecord] = useState(null);
  
  // 过滤相关状态
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(defaultFilterConfig);
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);

  // 存储过滤配置
  const saveFilterConfig = (config: FilterConfig) => {
    try {
      chrome.storage.local.set({ filterConfig: config });
    } catch (error) {
      console.warn('保存过滤配置失败:', error);
    }
  };

  // 加载过滤配置
  const loadFilterConfig = async () => {
    try {
      const result = await chrome.storage.local.get('filterConfig');
      if (result.filterConfig) {
        setFilterConfig(result.filterConfig);
      }
    } catch (error) {
      console.warn('加载过滤配置失败:', error);
    }
  };

  // 组件挂载时加载配置
  useEffect(() => {
    loadFilterConfig();
  }, []);

  // 处理过滤配置变化
  const handleFilterConfigChange = (config: FilterConfig) => {
    setFilterConfig(config);
    saveFilterConfig(config);
  };

  // 添加URL到过滤器
  const addToFilter = (record: any) => {
    const url = record.request.url;
    
    // 提取域名和路径作为模式
    try {
      const urlObj = new URL(url);
      const pattern = urlObj.pathname;
      
      const newRule: FilterRule = {
        id: Date.now().toString(),
        pattern: pattern,
        description: `来自: ${urlObj.hostname}`,
        enabled: true,
        type: 'string'
      };

      const newConfig = {
        ...filterConfig,
        rules: [...filterConfig.rules, newRule]
      };

      handleFilterConfigChange(newConfig);
      message.success(`已添加过滤规则: ${pattern}`);
      
      // 展开过滤面板
      setFilterPanelVisible(true);
      
    } catch (error) {
      // 如果URL解析失败，使用完整URL作为字符串匹配
      const newRule: FilterRule = {
        id: Date.now().toString(),
        pattern: url,
        description: '完整URL匹配',
        enabled: true,
        type: 'string'
      };

      const newConfig = {
        ...filterConfig,
        rules: [...filterConfig.rules, newRule]
      };

      handleFilterConfigChange(newConfig);
      message.success(`已添加过滤规则: ${url}`);
      setFilterPanelVisible(true);
    }
  };

  // 计算过滤后的请求数量
  const filteredRequests = applyFilter(uNetwork, filterConfig);
  
  // 修改表格数据源逻辑：先应用搜索框过滤，然后应用过滤规则样式
  const filteredRequestsForTable = uNetwork.filter((v: { request: { url: string; }; }) => 
    v.request.url.match(strToRegExp(filterKey))
  );

  // 在开发环境下初始化时加载模拟数据
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const mockData = generateMockNetworkData();
      setUNetwork(mockData);
      console.log('🚀 已直接注入模拟网络数据到表格中');
    }
  }, []);

  const setUNetworkData = function (request:any) {
    console.log('request', request);
    if (['fetch', 'xhr', 'websocket'].includes(request._resourceType)) {
      uNetwork.push(request);
      setUNetwork([...uNetwork]);
    }
  };
  
  // 监听页面脚本的 WebSocket 录制数据
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('event', event);
      if (event.data.type === 'websocketRecord') {
        const { wsId, eventType, eventData, timestamp } = event.data.data;
        
        if (eventType === 'connection') {
          // 添加新的 WebSocket 连接记录
          const wsRecord = {
            _resourceType: 'websocket',
            request: {
              url: eventData.url,
              method: 'WS'
            },
            response: {
              status: 'connecting'
            },
            _wsId: wsId,
            _wsMessages: []
          };
          setUNetworkData(wsRecord);
        } else if (['sent', 'received'].includes(eventType)) {
          // 更新现有 WebSocket 连接的消息
          setUNetwork(prev => prev.map(item => {
            if (item._wsId === wsId) {
              return {
                ...item,
                _wsMessages: [...(item._wsMessages || []), { type: eventType, data: eventData, timestamp }],
                response: { ...item.response, status: 'connected' }
              };
            }
            return item;
          }));
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  useEffect(() => {
    if (chrome.devtools) {
      if (recording) {
        requestFinishedRef.current = setUNetworkData;
        chrome.devtools.network.onRequestFinished.addListener(requestFinishedRef.current);
      } else {
        chrome.devtools.network.onRequestFinished.removeListener(requestFinishedRef.current);
      }
    }
  }, [recording]);
  useEffect(() => {
    if (chrome.devtools && recording && uNetwork.length < 1) {
      chrome.devtools.network.onRequestFinished.removeListener(requestFinishedRef.current);
      requestFinishedRef.current = setUNetworkData;
      chrome.devtools.network.onRequestFinished.addListener(requestFinishedRef.current);
    }
  }, [uNetwork]);

  const getChromeLocalStorage = (keys: string|string[]) => new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
  const onAddInterceptorClick = (
    record: {
      request: { url: string; };
      getContent: (arg0: (content: any) => void) => void;
    }
  ) => {
    const requestUrl = record.request.url.split('?')[0];
    const matchUrl = requestUrl.match('(?<=//.*/).+');
    if (record.getContent) {
      record.getContent((content) => {
        handleAddInterceptor({
          request: matchUrl && matchUrl[0] || '',
          responseText: content
        });
      });
    } else {
      handleAddInterceptor({
        request: matchUrl && matchUrl[0] || '',
        responseText: ''
      });
    }
  };
  const handleAddInterceptor = async (
    { request, responseText }: { request: string, responseText: string }
  ) => {
    try {
      const { ajaxDataList = [], iframeVisible }: AddInterceptorParams|any = await getChromeLocalStorage(['iframeVisible', 'ajaxDataList']);
      const interfaceList = ajaxDataList.flatMap((item: { interfaceList: DefaultInterfaceObject[]; }) => item.interfaceList || []);
      const hasIntercepted = interfaceList.some((v: { request: string | null; }) => v.request === request);
      if (hasIntercepted) {
        const confirmed = await new Promise((resolve) => {
          Modal.confirm({
            title: 'Request Already Intercepted',
            content: 'This request has already been intercepted. Do you want to add another interceptor?',
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
        if (confirmed) {
          await addInterceptorIfNeeded({ ajaxDataList, iframeVisible, request, responseText });
        }
      } else {
        await addInterceptorIfNeeded({ ajaxDataList, iframeVisible, request, responseText });
      }
    } catch(error) {
      console.error(error);
    }
  };
  const addInterceptorIfNeeded = async ({ ajaxDataList, iframeVisible, request, responseText }: AddInterceptorParams) => {
    if (ajaxDataList.length === 0) { // 首次，未添加过拦截接口
      ajaxDataList = [{
        summaryText: 'Group Name（Editable）',
        collapseActiveKeys: [],
        headerClass: 'ajax-tools-color-volcano',
        interfaceList: []
      }];
    }
    const groupIndex: any = ajaxDataList.length > 1 ? await showGroupModal({ ajaxDataList }) : 0;
    showSidePage(iframeVisible);
    addInterceptor({ ajaxDataList, groupIndex, request, responseText });
  };
  const showGroupModal = ({ ajaxDataList }: { ajaxDataList: AjaxDataListObject[] }) => new Promise((resolve) => {
    const SelectGroupContent = (props: { onChange: (arg0: any) => void; }) => {
      const [value, setValue] = useState(0);
      return <Radio.Group
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          props.onChange(e.target.value);
        }}
      >
        <Space direction="vertical">
          {ajaxDataList.map((v, index) => <Radio key={index} value={index}>Group {index + 1}：{v.summaryText}</Radio>)}
        </Space>
      </Radio.Group>;
    };
    let _groupIndex = 0;
    Modal.confirm({
      title: 'Which group to add to',
      content: <SelectGroupContent onChange={(value) => _groupIndex = value}/>,
      onOk: () => resolve(_groupIndex),
    });
  });
  const showSidePage = (iframeVisible: undefined | boolean) => {
    if (iframeVisible) { // 当前没展示，要展示
      chrome.tabs.query(
        { active: true, currentWindow: true },
        function (tabs) {
          const tabId = tabs[0]?.id;
          // 发送消息到content.js
          if (tabId) {
            chrome.tabs.sendMessage(
              tabId,
              { type: 'iframeToggle', iframeVisible },
              function (response) {
                // console.log('【uNetwork/App.jsx】->【content】【ajax-tools-iframe-show】Return message:', response);
                chrome.storage.local.set({ iframeVisible: response.nextIframeVisible });
              }
            );
          }
        }
      );
    }
  };
  const addInterceptor = (
    { ajaxDataList, groupIndex = 0, request, responseText }: AddInterceptorParams
  ) => {
    const key = String(Date.now());
    ajaxDataList[groupIndex]!.collapseActiveKeys.push(key);
    const interfaceObj: DefaultInterfaceObject = {
      ...defaultInterface,
      key,
      request,
      responseText,
    };
    ajaxDataList[groupIndex].interfaceList.push(interfaceObj);
    // 发送给iframe(src/App.jsx)侧边页面，更新ajaxDataList
    chrome.runtime.sendMessage(chrome.runtime.id, {
      type: 'ajaxTools_updatePage',
      to: 'mainSettingSidePage',
      ajaxDataList
    });
  };
  const onRequestUrlClick = (record: React.SetStateAction<null>) => {
    setCurrRecord(record);
    setDrawerOpen(true);
  };

  // 导出请求记录为JSON文件
  const exportRequests = async () => {
    // 应用过滤规则
    const requestsToExport = applyFilter(uNetwork, filterConfig);
    
    if (requestsToExport.length === 0) {
      message.warning('没有符合过滤条件的请求可导出');
      return;
    }

    // 获取响应内容的辅助函数
    const getResponseContent = (request: any) => {
      return new Promise((resolve) => {
        if (request.getContent) {
          request.getContent((content: any) => {
            // 尝试解析JSON响应
            try {
              // 如果内容是JSON字符串，将其解析为对象
              const parsedContent = JSON.parse(content);
              resolve(parsedContent);
            } catch (e) {
              // 如果不是有效的JSON，保持原始内容
              resolve(content);
            }
          });
        } else {
          resolve(null);
        }
      });
    };
    
    // 移除URL中的查询参数
    const getBaseUrl = (url: string) => {
      try {
        const urlObj = new URL(url);
        return `${urlObj.origin}${urlObj.pathname}`;
      } catch (e) {
        // 如果URL解析失败，返回原始URL
        return url;
      }
    };
    
    // 准备导出数据基本结构
    const exportData = {
      exportedAt: new Date().toISOString(),
      filterConfig: filterConfig, // 记录使用的过滤配置
      totalRequests: uNetwork.length,
      filteredRequests: requestsToExport.length,
      requests: [] as Array<{
        url: string;
        method: string;
        response: any;
      }>
    };
    
    // 遍历请求并获取响应内容
    for (const request of requestsToExport) {
      const responseContent = await getResponseContent(request);
      const method = request.request.method.toLowerCase();
      
      // 只添加简化的请求信息
      exportData.requests.push({
        url: getBaseUrl(request.request.url),
        method: method,
        response: responseContent // 已解析为原始格式（如果是JSON）
      });
    }
    
    // 使用现有的导出函数
    const filename = `ajax-requests-filtered-${new Date().toISOString().replace(/:/g, '-')}`;
    exportJSON(filename, exportData);
    
    message.success(`已导出 ${requestsToExport.length} 条过滤后的请求数据`);
  };

  // 预览导出数据
  const previewExportData = () => {
    const requestsToExport = applyFilter(uNetwork, filterConfig);
    
    Modal.info({
      title: '导出数据预览',
      content: (
        <div>
          <p><strong>过滤模式:</strong> {filterConfig.mode === 'include' ? '包含模式' : '排除模式'}</p>
          <p><strong>过滤规则:</strong> {filterConfig.rules.length} 条</p>
          <p><strong>总请求数:</strong> {uNetwork.length}</p>
          <p><strong>符合条件的请求:</strong> {requestsToExport.length}</p>
          <div style={{ marginTop: 16 }}>
            <strong>将导出的URL列表:</strong>
            <div style={{ 
              maxHeight: 200, 
              overflow: 'auto', 
              border: '1px solid #d9d9d9', 
              padding: 8, 
              marginTop: 8,
              fontSize: 12,
              fontFamily: 'monospace'
            }}>
              {requestsToExport.slice(0, 20).map((req, index) => (
                <div key={index}>
                  {req.request.method} {req.request.url}
                </div>
              ))}
              {requestsToExport.length > 20 && (
                <div style={{ color: '#999' }}>
                  ... 还有 {requestsToExport.length - 20} 条请求
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      width: 600,
      okText: '确定'
    });
  };

  // 重新生成模拟数据 (替代原来的测试API功能)
  const regenerateMockData = () => {
    if (process.env.NODE_ENV !== 'development') {
      console.log('⚠️ 模拟数据功能仅在开发环境中可用');
      return;
    }
    
    console.log('🔄 重新生成模拟网络数据...');
    const mockData = generateMockNetworkData();
    setUNetwork(mockData);
    console.log('✅ 模拟数据已更新！');
  };

  const columns = getColumns({
    onAddInterceptorClick,
    onRequestUrlClick,
    onAddToFilter: addToFilter,
    filterConfig: filterConfig, // 传递filterConfig
    filteredRequestsForTable: filteredRequestsForTable, // 传递数据源
  });
  
  return <div>
    <div className="ajax-tools-devtools-action-bar">
      <Button
        type="text"
        shape="circle"
        danger={recording}
        title={recording ? 'Stop recording network log' : 'Record network log'}
        icon={recording ? <PauseCircleFilled/> : <PlayCircleTwoTone/>}
        onClick={() => setRecording(!recording)}
      />
      <Button
        type="text"
        shape="circle"
        title="Clear"
        icon={<StopOutlined/>}
        onClick={() => setUNetwork([])}
      />
      {/* 修改导出按钮 */}
      <Button
        type="text"
        shape="circle"
        title={`Export Requests${filterConfig.rules.length > 0 ? ' (已设置过滤规则)' : ''}`}
        icon={<DownloadOutlined/>}
        onClick={() => exportRequests()}
        disabled={uNetwork.length === 0}
        style={{ 
          color: filterConfig.rules.length > 0 ? '#1890ff' : undefined 
        }}
      />
      {/* 开发环境模拟数据按钮 */}
      {process.env.NODE_ENV === 'development' && (
        <Button
          type="primary"
          size="small"
          title="重新生成模拟数据 (仅开发环境)"
          style={{ marginLeft: 8 }}
          onClick={regenerateMockData}
        >
          🔄 重新生成模拟数据
        </Button>
      )}
      <Input
        placeholder="Filter RegExp"
        size="small"
        style={{ width: 160, marginLeft: 16 }}
        onChange={(e) => setFilterKey(e.target.value)}
      />
    </div>
    
    {/* 过滤设置面板 */}
    <FilterPanel
      visible={filterPanelVisible}
      onToggle={() => setFilterPanelVisible(!filterPanelVisible)}
      config={filterConfig}
      onChange={handleFilterConfigChange}
      requestsCount={uNetwork.length}
      filteredCount={filteredRequests.length}
      onPreview={previewExportData}
    />
    
    <VTablePro
      bordered
      headerNotSticky
      columns={columns}
      dataSource={filteredRequestsForTable}
      visibleHeight={window.innerHeight - (filterPanelVisible ? 350 : 50)}
      rowHeight={24}
      estimatedRowHeight={24}
      locale={{
        emptyText: <div style={{ textAlign: 'center' }}>
          <p>Recording network activity... </p>
          <p>Click Record, and then Perform a request or hit <strong>⌘ R</strong> to record the load.</p>
        </div>
      }}
    />
    {
      currRecord && <RequestDrawer
        record={currRecord}
        drawerOpen={drawerOpen}
        onAddInterceptorClick={onAddInterceptorClick}
        onClose={() => setDrawerOpen(false)}
      />
    }
  </div>;
};

export default App;

