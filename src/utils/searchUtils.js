const fs = require('fs');
const path = require('path');
const mm = require("music-metadata");
const crypto = require("crypto");
const {log} = require("wechaty");
const os = require("os");
const rootDir = 'E:\\Boot-Root-Dir\\';
const musicFileExtName = ['mp3','MP3','FLAC','flac']
async function readDirectoryTree(directoryPath = rootDir) {
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
            const child = await readDirectoryTree(filePath)
            directoryTree.children.push(child);
        } else {
            // 如果是文件，添加文件信息到子目录列表中
            // 替换根路径
            const replacedPath = filePath.replace(rootDir, '');
            // 将 '\\' 替换为空格
            const searchKey = replacedPath.replace(/\\/g, '');
            const fileNode = {
                name: file,
                type: 'file',
                size: stats.size, // 文件大小（字节）
                fileType: path.extname(file), // 文件类型（后缀名）
                path: filePath, // 添加完整路径
                searchKey: searchKey // 搜索key
            }
            // 音乐文件属性
            if (musicFileExtName.includes(getFileExt(file))) {
                const metadata = await mm.parseFile(filePath);
                // 歌曲名称 、 专辑名称  、  艺术家名称
                const metaObj = {
                    title:metadata.common.title,
                    album:metadata.common.album,
                    artist:metadata.common.artist,
                }
                fileNode.metadata = metaObj
            }
            // 计算md5
            calculateMD5(fileNode)
            directoryTree.children.push(fileNode);
        }
    }
    return directoryTree;
}

function getFileExt(filename) {
    if (filename.split('.').length > 1) {
        return filename.split('.').pop()
    } else {
        return ''
    }
}
// 计算文件的 MD5 值，并将结果赋值给对象的属性
async function calculateMD5(obj) {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(obj.path);

    stream.on('data', (data) => {
        hash.update(data);
    });

    stream.on('end', () => {
        const md5Val = hash.digest('hex')
        obj['md5'] = md5Val;
        fileMd5Map.set(md5Val,obj)
    });
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
const localCacheFilePath = path.join(os.homedir(), '.file-list.json');

async function saveFileList() {
    const list = JSON.stringify(searchFileList);
    await fs.writeFileSync(localCacheFilePath, list);
    console.log('文件列表数据已保存。');
}
const searchFileList = []
const fileMd5Map = new Map()
async function initData() {
    if (!fs.existsSync(localCacheFilePath)) {
        searchFileList.push(...getLeafNodes(await readDirectoryTree()))
    } else {
        const data = fs.readFileSync(localCacheFilePath, 'utf8');
        searchFileList.push(...JSON.parse(data))
        searchFileList.forEach(item => {
            fileMd5Map.set(item.md5,item)
        })
    }
}
initData().then(r => {
    log.info("文件列表加载完毕...",searchFileList.length)
    // console.log(fileMd5Map)
})

module.exports = {searchFileList,rootDir,fileMd5Map,saveFileList};
