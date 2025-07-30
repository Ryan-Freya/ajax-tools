import { spawnSync } from 'child_process';
import { resolve } from 'path';

// 构建 html/iframePage 项目
const targetDir = resolve('html/iframePage');
console.log(`Building project at ${targetDir}...`);
const result = spawnSync('npm', ['run', 'build'], { cwd: targetDir, stdio: 'inherit', shell: true });

// 如果构建失败，则退出并返回错误码
if (result.status !== 0) {
  process.exit(result.status);
}
