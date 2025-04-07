import { Client } from "@notionhq/client";

// 初始化Notion客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log("API调用开始");
    
    // 获取查询参数
    const { tag, search } = req.query;
    console.log("查询参数:", { tag, search });
    
    // 首先获取数据库元数据以获取数据库名称（作为歌手名）
    console.log("获取数据库元数据...");
    const databaseInfo = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID
    });

    // 从数据库标题中提取歌手名称
    const artist = databaseInfo.title[0]?.plain_text || "未知歌手";
    console.log(`数据库名称 (歌手): ${artist}`);

    // 构建查询
    const queryParams = {
      database_id: process.env.NOTION_DATABASE_ID
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
    
    console.log("执行Notion查询...");
    const results = await notion.databases.query(queryParams);
    console.log(`查询结果: ${results.results.length}条记录`);
    
    // 构建歌曲列表 - 与myQuery.js代码匹配
    const songs = [];
    for(const result of results.results) {
      try {
        const song = result.properties.Song.title[0]?.text?.content;
        const songUrl = result.properties.SongFile.files[0]?.external?.url || 
                     result.properties.SongFile.files[0]?.file?.url;
        const lrcUrl = result.properties.LyricFile?.files[0]?.external?.url ||
                     result.properties.LyricFile?.files[0]?.file?.url;
        
        if(song && songUrl) {
          songs.push({
            title: song,
            artist: artist,
            url: songUrl,
            lrc: lrcUrl || null
          });
          console.log(`处理歌曲: ${song}`);
        }
      } catch (error) {
        console.error("处理单条记录错误:", error);
      }
    }
    
    console.log(`成功处理 ${songs.length} 首歌曲`);
    res.status(200).json({
      name: 'Notion音乐库',
      artist: artist,
      songs: songs
    });
  } catch (error) {
    console.error("API错误:", error);
    res.status(500).json({ 
      error: '获取Notion数据失败',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
