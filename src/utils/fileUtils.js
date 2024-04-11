const fs = require('fs');
const path = require('path');
const mm = require("music-metadata");

const rootDir = 'E:\\Boot-Root-Dir';
let dirTree = readDirectoryTree()

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

    files.forEach(file => {
        // 构建文件/目录的完整路径
        const filePath = path.join(directoryPath, file);
        // 获取文件/目录的状态信息
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // 如果是目录，递归读取子目录的树形结构
            directoryTree.children.push(readDirectoryTree(filePath));
        } else {
            // 如果是文件，添加文件信息到子目录列表中
            directoryTree.children.push({
                name: file,
                type: 'file',
                size: stats.size, // 文件大小（字节）
                fileType: path.extname(file), // 文件类型（后缀名）
                path: filePath, // 添加完整路径
            });
        }
    });

    // 添加获取完整路径的方法
    directoryTree.getFullPath = function() {
        return this.path;
    };
    return directoryTree;
}

// 读取指定目录的树形结构
// const tree = readDirectoryTree(directoryPath);

async function searchFileInTree(searchString,tree = dirTree) {
    const parts = searchString.trim().split(/\s+/); // 使用正则表达式匹配多个空格并分割字符串
    let folderName = '';
    let subFolderName = '';
    let fileName = '';

    // 解析用户输入的字符串
    if (parts.length === 1) {
        fileName = parts[0];
    } else if (parts.length === 2) {
        // 判断省略的是文件夹名称还是子文件夹名称
        if (tree.children.some(child => child.name === parts[0])) {
            subFolderName = parts[0];
            fileName = parts[1];
        } else {
            folderName = parts[0];
            fileName = parts[1];
        }
    } else if (parts.length === 3) {
        folderName = parts[0];
        subFolderName = parts[1];
        fileName = parts[2];
    } else {
        console.log('输入格式不正确，请按照“{文件夹名称} {子文件夹名称} {文件名称}”的格式输入。');
        return;
    }

    // 将文件名称字符串转换为正则表达式
    const fileNameRegex = new RegExp(fileName.replace(/\./g, '\\.'), 'i'); // 忽略大小写

    // 遍历目录树，查找文件
    async function findFile(node) {
        const findFileList = []
        if (node.type === 'file') {
            // 如果节点是文件，检查是否匹配
            if ((folderName === '' || node.path.includes(folderName)) &&
                (subFolderName === '' || node.path.includes(subFolderName)) &&
                fileNameRegex.test(node.name)) {
                const metadata = await mm.parseFile(node.path);
                node.metadata = metadata
                findFileList.push(node);
                console.log('找到文件：', node);
            }
        } else if (node.type === 'directory') {
            // 如果节点是目录，递归查找子节点
            for (const child of node.children) {
                const childrenFileList = await findFile(child)
                if (childrenFileList.length > 0) {
                    findFileList.push(...childrenFileList);
                }
            }
        }
        return findFileList;
    }

    // 调用查找函数
    return await findFile(tree);
}

module.exports = {readDirectoryTree,searchFileInTree};
