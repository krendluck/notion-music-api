const { Client } = require("@notionhq/client");

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const notion = new Client({
      auth: process.env.NOTION_API_KEY
    });
    
    // 获取查询参数
    const { tag, search } = req.query;
    
    // 构建查询
    const queryParams = {
      database_id: process.env.NOTION_DATABASE_ID,
    };
    
    // 添加过滤条件 (如果有)
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
    
    // 完全匹配myQuery.js中的数据结构
    const results = await notion.databases.query(queryParams);
    
    // 构建歌曲列表 (与myQuery.js代码完全一致)
    const songs = [];
    for(const result of results.results) {
      let song = result.properties.Song.title[0]?.text.content;
      let songUrl = result.properties.SongFile.files[0]?.external?.url || 
                  result.properties.SongFile.files[0]?.file?.url;
      let lrcUrl = result.properties.LyricFile?.files[0]?.external?.url ||
                  result.properties.LyricFile?.files[0]?.file?.url;
      
      if(song && songUrl) {
        songs.push({
          title: song,
          url: songUrl,
          lrc: lrcUrl || null
        });
      }
    }
    
    // 返回结果
    res.status(200).json({
      name: '我的Notion音乐库',
      songs
    });
  } catch (error) {
    console.error("API错误:", error);
    res.status(500).json({ 
      error: '获取Notion数据失败',
      message: error.message
    });
  }
};
