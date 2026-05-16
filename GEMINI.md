# ⚠️ [CRITICAL DIRECTIVE] Git 操作绝对安全红线
1. **绝对禁止 `git reset --hard`**：永远不允许在当前分支使用此命令回退历史，严禁覆写或删除任何 commit。
2. **强制 Stash 机制**：进行任何危险操作前，必须先执行 `git stash -u`。
3. **回退等同于新建分支**：如果用户要求回到某个历史节点重新开始，**必须**使用 `git checkout -b <新分支名> <commit-hash>` 的方式切出新分支进行延申，绝对保护原分支的历史线。