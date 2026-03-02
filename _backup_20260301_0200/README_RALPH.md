# Ralph 使用指南

Ralph 是一个自主 AI 代理循环，反复运行 AI 编码工具（Claude Code）直到所有 PRD 项完成。

## ✅ 前置条件

- Claude Code 2.1.51 已安装 (`~/.local/bin/claude`)
- jq 已安装
- Git 仓库已初始化

## 📦 Skills 已安装

- `/prd` - 生成 PRD（产品需求文档）
- `/ralph` - 将 PRD 转换为 prd.json

## 🔄 工作流程

### 1. 创建 PRD

在 Claude Code 中使用 prd skill：

```bash
claude
```

然后输入：
```
/prd
创建一个用户认证功能的 PRD
```

回答澄清问题，PRD 会保存到 `tasks/prd-[feature-name].md`

### 2. 转换 PRD 为 Ralph 格式

```
/ralph
将 tasks/prd-[feature-name].md 转换为 prd.json
```

这会创建 `prd.json`，包含结构化的用户故事。

### 3. 运行 Ralph

```bash
# 使用 Claude Code（默认 10 次迭代）
./scripts/ralph/ralph.sh --tool claude

# 自定义迭代次数
./scripts/ralph/ralph.sh --tool claude 20
```

Ralph 会：
1. 创建特性分支（从 PRD 的 branchName）
2. 选择最高优先级的 `passes: false` 故事
3. 实现该故事
4. 运行质量检查（typecheck, tests）
5. 检查通过后提交
6. 更新 prd.json 标记为 `passes: true`
7. 追加学习到 progress.txt
8. 重复，直到所有故事完成或达到最大迭代次数

## 📂 关键文件

| 文件 | 用途 |
|------|------|
| `scripts/ralph/ralph.sh` | Bash 循环脚本 |
| `scripts/ralph/CLAUDE.md` | Claude Code 提示模板 |
| `prd.json` | 任务列表（用户故事 + 状态） |
| `prd.json.example` | 示例 PRD 格式 |
| `progress.txt` | 追加式学习记录 |
| `tasks/prd-*.md` | PRD 文档 |

## 🐛 调试

```bash
# 查看哪些故事已完成
cat prd.json | jq '.userStories[] | {id, title, passes}'

# 查看学习记录
cat progress.txt

# 查看 git 历史
git log --oneline -10
```

## 💡 关键概念

### 每次迭代 = 新上下文
每次迭代生成新的 Claude Code 实例。迭代间的记忆仅通过：
- Git 历史
- progress.txt
- prd.json

### 小任务
每个 PRD 项应该足够小，在一个上下文窗口内完成。

**合适的故事：**
- 添加数据库列和迁移
- 添加 UI 组件到现有页面
- 更新服务器操作逻辑

**太大（需要拆分）：**
- "构建整个仪表板"
- "添加认证"
- "重构 API"

### 停止条件
当所有故事的 `passes: true` 时，Ralph 输出 `<promise>COMPLETE</promise>` 并退出。

## 🔗 参考

- [snarktank/ralph GitHub](https://github.com/snarktank/ralph)
- [交互式流程图](https://snarktank.github.io/ralph/)
- [Geoffrey Huntley 的 Ralph 文章](https://ghuntley.com/ralph/)
