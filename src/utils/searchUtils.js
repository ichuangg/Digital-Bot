const fs = require('fs');
const path = require('path');


const rootDir = 'E:\\Boot-Root-Dir';


function readDirectoryTree(directoryPath = rootDir) {
    // 获取目录下的所有文件和子目录
    const files = fs.readdirSync(directoryPath);
    // 存储当前目录的子目录和文件
    const directoryTree = {
        name: path.basename(directoryPath),
        type: 'directory',
        path: directoryPath, // 添加完整路径
        children: []
    };

    for (const file of files) {
        // 构建文件/目录的完整路径
        const filePath = path.join(directoryPath, file);
        // 获取文件/目录的状态信息
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // 如果是目录，递归读取子目录的树形结构
            const child = readDirectoryTree(filePath)
            directoryTree.children.push(child);
        } else {
            // 如果是文件，添加文件信息到子目录列表中
            // 替换根路径
            const replacedPath = filePath.replace(rootDir, '');
            // 将 '\\' 替换为空格
            const searchKey = replacedPath.replace(/\\/g, '');
            directoryTree.children.push({
                name: file,
                type: 'file',
                size: stats.size, // 文件大小（字节）
                fileType: path.extname(file), // 文件类型（后缀名）
                path: filePath, // 添加完整路径
                searchKey: searchKey // 搜索key
            });
        }
    }

    // 添加获取完整路径的方法
    directoryTree.getFullPath = function () {
        return this.path;
    };
    return directoryTree;
}

function getLeafNodes(tree) {
    const leafNodes = [];

    // 遍历树节点
    function traverse(node) {
        if (node.children && node.children.length > 0) {
            // 如果当前节点有子节点，继续递归遍历子节点
            node.children.forEach(child => traverse(child));
        } else {
            // 如果当前节点没有子节点，将其添加到叶子节点列表中
            leafNodes.push(node);
        }
    }

    // 开始递归遍历
    traverse(tree);

    return leafNodes;
}


const searchFileList = getLeafNodes(readDirectoryTree())
module.exports = {searchFileList};

