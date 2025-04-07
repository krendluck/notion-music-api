const { Client } = require("@notionhq/client");

// 初始化Notion客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  try {
    // 添加调试日志
    console.log("开始获取Notion数据");
    console.log("Database ID:", process.env.NOTION_DATABASE_ID ? "已设置" : "未设置");
    console.log("API Key:", process.env.NOTION_API_KEY ? "已设置(长度:" + process.env.NOTION_API_KEY.length + ")" : "未设置");
    
    const databaseId = process.env.NOTION_DATABASE_ID;
    
    // 获取查询参数
    const { tag, search } = req.query;
    
    // 构建Notion查询
    const queryParams = {
      database_id: databaseId,
    };
    
    // 添加查询条件（与myQuery.js一致）
    // ...
    
    // 查询数据库
    console.log("执行查询...");
    const results = await notion.databases.query(queryParams);
    console.log(`查询结果: ${results.results.length}条记录`);
    
    // 构建歌曲列表，使用与myQuery.js相同的结构
    const songs = [];
    for(const result of results.results) {
      try {
        let song = result.properties.Song?.title[0]?.text.content;
        let songUrl = result.properties.SongFile?.files[0]?.external?.url || 
                    result.properties.SongFile?.files[0]?.file?.url;
        let lrcUrl = result.properties.LyricFile?.files[0]?.external?.url ||
                    result.properties.LyricFile?.files[0]?.file?.url;
        
        if(song && songUrl) {
          songs.push({
            title: song,
            url: songUrl,
            lrc: lrcUrl || null
          });
        }
      } catch (err) {
        console.error("处理单条记录时出错:", err);
      }
    }
    
    // 返回数据
    console.log(`共找到${songs.length}首歌曲`);
    res.status(200).json({
      name: '我的Notion音乐库',
      songs: songs
    });
  } catch (error) {
    // 详细的错误记录
    console.error("API错误详情:", error);
    res.status(500).json({ 
      error: '获取Notion数据失败',
      message: error.message,
      code: error.code
    });
  }
};
