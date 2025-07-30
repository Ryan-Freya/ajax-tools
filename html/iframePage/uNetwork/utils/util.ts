// postData可能的格式:
/*
 `postData 
Object
{
mimeType: "application/json; charset=UTF-8"
text: "{\"operationName\":\"getCoverUsers\",\"query\":\"\\n  query getCoverUsers {\\n    userManagementQuery {\\n      coverUsers {\\n        userId\\n        firstName\\n        lastName\\n      }\\n    }\\n  }\\n\"}"
}
 */

// 判断是否为普通对象
function isPlainObject(obj: any): obj is Record<string, any> {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

// 处理 postData 为对象的情况，优先解析 text 字段
function parsePostDataObject(obj: Record<string, any>): Record<string, any> {
  // If the object has a 'text' field and it's a string, try to parse it recursively
  if (typeof obj.text === 'string') {
    return JSON.parse(obj.text);
  }
  // Otherwise, return a shallow copy of the object
  return { ...obj };
}

const parsePostData = (postData: string | object | undefined | null): Record<string, any> | string => {
  if (isPlainObject(postData)) {
    return parsePostDataObject(postData);
  }
  if (!postData || typeof postData !== 'string' || postData.trim() === '') {
    return {};
  }
  // Try to parse as JSON
  try {
    const json = JSON.parse(postData);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      return json;
    }
    // 如果是数组或其他非对象类型，返回空对象
    return {};
  } catch {/* ignore */}
  // Only try URL-encoded if '=' is present
  if (!postData.includes('=')) {
    return {};  // 修改这里，对于无效的 JSON 和不包含 '=' 的字符串，返回空对象而不是原始字符串
  }
  try {
    return Object.fromEntries(
      postData.split('&').map(pair => {
        const [key, value] = pair.split('=');
        return [decodeURIComponent(key), decodeURIComponent(value ?? '')];
      })
    );
  } catch {
    return {};
  }
};

export { parsePostData, parsePostDataObject };