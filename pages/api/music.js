const { Client } = require("@notionhq/client");

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // 初始化Notion客户端
    const notion = new Client({
      auth: process.env.NOTION_API_KEY
    });
    
    console.log("API调用开始...");
    console.log("是否有API密钥:", !!process.env.NOTION_API_KEY);
    console.log("是否有数据库ID:", !!process.env.NOTION_DATABASE_ID);
    
    // 获取查询参数
    const { tag, search } = req.query;
    
    // 构建查询参数 - 与myQuery.js保持一致
    const queryParams = {
      database_id: process.env.NOTION_DATABASE_ID,
    };
    
    // 添加过滤条件
    if (tag) {
      queryParams.filter = {
        property: 'Tags',
        multi_select: {
          contains: tag
        }
      };
    }
    
    if (search) {
      queryParams.filter = {
        or: [
          {
            property: 'Song',
            title: {
              contains: search
            }
          }
        ]
      };
    }
    
    // 执行查询
    console.log("执行Notion查询...");
    const results = await notion.databases.query(queryParams);
    console.log(`查询结果: ${results.results.length}条记录`);
    
    // 构建歌曲列表 - 完全匹配myQuery.js中的结构
    const songs = [];
    for(const result of results.results) {
      try {
        // 这里的属性名必须与您的Notion数据库完全一致
        let song = result.properties.Song?.title[0]?.text.content;
        let songUrl = result.properties.SongFile?.files[0]?.external?.url || 
                    result.properties.SongFile?.files[0]?.file?.url;
        let lrcUrl = result.properties.LyricFile?.files[0]?.external?.url ||
                    result.properties.LyricFile?.files[0]?.file?.url;
        let artist = result.properties.Artist?.rich_text[0]?.text.content || "未知歌手";
        
        if(song && songUrl) {
          songs.push({
            title: song,
            artist: artist,
            url: songUrl,
            lrc: lrcUrl || null
          });
        }
      } catch (err) {
        console.error("处理单条记录时出错:", err);
      }
    }
    
    console.log(`成功处理 ${songs.length} 首歌曲`);
    res.status(200).json({
      name: '我的Notion音乐库',
      songs: songs
    });
  } catch (error) {
    // 详细的错误记录
    console.error("API详细错误:", error);
    res.status(500).json({ 
      error: '获取Notion数据失败',
      message: error.message,
      code: error.code || 'unknown'
    });
  }
};
