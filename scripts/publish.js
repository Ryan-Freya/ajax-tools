const fs = require('fs');
const path = require('path');

// 定义源文件和目标文件的映射
const publishFiles = [
  // 根目录文件
  'content.js',
  'manifest.json',
  'service_worker.js',
  
  // devtoolsPage 目录
  'devtoolsPage/index.html',
  'devtoolsPage/index.js',
  
  // html/iframePage/dist 目录及其所有内容
  'html/iframePage/dist',
  
  // icons 目录及其所有内容
  'icons'
];

/**
 * 复制文件或目录
 */
function copyFileOrDir(srcPath, destPath) {
  const srcFullPath = path.resolve(srcPath);
  const destFullPath = path.resolve(destPath);
  
  // 确保目标目录存在
  const destDir = path.dirname(destFullPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  if (fs.statSync(srcFullPath).isDirectory()) {
    // 如果是目录，递归复制
    copyDirectory(srcFullPath, destFullPath);
  } else {
    // 如果是文件，直接复制
    fs.copyFileSync(srcFullPath, destFullPath);
    console.log(`复制文件: ${srcPath} -> ${destPath}`);
  }
}

/**
 * 递归复制目录
 */
function copyDirectory(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const items = fs.readdirSync(srcDir);
  
  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`复制文件: ${path.relative(process.cwd(), srcPath)} -> ${path.relative(process.cwd(), destPath)}`);
    }
  }
}

/**
 * 清理发布目录
 */
function cleanPublishDir() {
  const publishDir = path.resolve('publish');
  if (fs.existsSync(publishDir)) {
    fs.rmSync(publishDir, { recursive: true, force: true });
    console.log('清理旧的publish目录');
  }
}

/**
 * 主函数
 */
function main() {
  console.log('开始执行发布脚本...');
  
  // 清理旧的发布目录
  cleanPublishDir();
  
  // 创建发布目录
  const publishDir = path.resolve('publish');
  fs.mkdirSync(publishDir, { recursive: true });
  console.log('创建publish目录');
  
  // 复制发布文件
  for (const filePath of publishFiles) {
    const srcPath = path.resolve(filePath);
    const destPath = path.resolve('publish', filePath);
    
    if (fs.existsSync(srcPath)) {
      try {
        copyFileOrDir(srcPath, destPath);
      } catch (error) {
        console.error(`复制失败: ${filePath}`, error);
      }
    } else {
      console.warn(`源文件不存在: ${filePath}`);
    }
  }
  
  console.log('发布脚本执行完成！');
  console.log('发布文件已复制到 publish/ 目录');
}

// 执行主函数
if (require.main === module) {
  main();
} 