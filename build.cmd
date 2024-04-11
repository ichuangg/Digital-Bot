# 安装打包工具
npm install --save-dev caxa

# 打包命令
格式 caxa --input 根目录 --output 输出文件 运行命令{{caxa}}代表根目录
详细参数查看https://www.npmjs.com/package/caxa
caxa --exclude "encrypt/* config/* *.exe" --input  "./" --output "wechaty-xp.exe"   "{{caxa}}/node_modules/.bin/node" "{{caxa}}/start.js" -m "第一次启动会很慢大约需要10-20分钟请稍后 解压缩中..."

# 说明
使用pkg 、 node-pack 等流行工具打包后找不到模块
可能是底层使用farid调用到系统函数问题
经过测试caxa打包后可以运行。

# 打包注意事项
1. 打包后大小为70-80m，如果文件过大，查看命令执行目录中其他没有使用--exclude排除的文件
2. 第一次打包启动大约需要10几分钟 耐心等待
3. 长时间启动不成功，结束重启。
