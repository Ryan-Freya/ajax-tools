import { parsePostData, parsePostDataObject } from './util';

describe('parsePostData', () => {
  it('should parse JSON string', () => {
    const input = '{"a":1,"b":"2"}';
    expect(parsePostData(input)).toEqual({ a: 1, b: '2' });
  });

  it('should parse url-encoded string', () => {
    const input = 'a=1&b=2';
    expect(parsePostData(input)).toEqual({ a: '1', b: '2' });
  });

  it('should decode url-encoded values', () => {
    const input = 'a=hello%20world&b=%E4%B8%AD%E6%96%87';
    expect(parsePostData(input)).toEqual({ a: 'hello world', b: '中文' });
  });

  it('should return empty object for empty string', () => {
    expect(parsePostData('')).toEqual({});
  });

  it('should return empty object for null/undefined', () => {
    expect(parsePostData(null as any)).toEqual({});
    expect(parsePostData(undefined as any)).toEqual({});
  });

  it('should return empty object for invalid JSON and not url-encoded', () => {
    expect(parsePostData('{a:1,b:2}')).toEqual({});
  });

  it('should return empty object for JSON array', () => {
    expect(parsePostData('[1,2,3]')).toEqual({});
  });

  it('should handle key without value', () => {
    expect(parsePostData('a=1&b')).toEqual({ a: '1', b: '' });
  });

  it('should return the object itself if postData is an object', () => {
    const obj = { a: 1, b: '2' };
    expect(parsePostData(obj)).toEqual({ a: 1, b: '2' });
  });

  it('should parse text field if postData is an object with text', () => {
    const obj = { text: '{"a":1,"b":2}' };
    expect(parsePostData(obj)).toEqual({ a: 1, b: 2 });
  });
});

describe('parsePostDataObject', () => {
  it('should parse text field if present and is JSON', () => {
    const obj = { text: '{"a":1,"b":2}' };
    expect(parsePostDataObject(obj)).toEqual({ a: 1, b: 2 });
  });

  it('should return shallow copy if no text field', () => {
    const obj = { a: 1, b: 2 };
    expect(parsePostDataObject(obj)).toEqual({ a: 1, b: 2 });
  });

  it('should return shallow copy if text is not string', () => {
    const obj = { text: 123, a: 1 };
    expect(parsePostDataObject(obj)).toEqual({ text: 123, a: 1 });
  });
}); 