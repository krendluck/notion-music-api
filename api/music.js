// filepath: api/music.js
const { Client } = require('@notionhq/client');

// 初始化 Notion 客户端
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

module.exports = async (req, res) => {
  // 允许跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // 获取数据库 ID
    const databaseId = process.env.NOTION_DATABASE_ID;
    
    // 从查询参数获取筛选条件
    const { tag, search } = req.query;
    
    // 构建查询
    const query = {
      database_id: databaseId,
      sorts: [
        {
          property: 'Title',
          direction: 'ascending',
        },
      ],
    };
    
    // 添加筛选
    if (tag) {
      query.filter = {
        property: 'Tags',
        multi_select: {
          contains: tag,
        },
      };
    }
    
    // 搜索功能
    if (search) {
      // 覆盖前面的筛选
      query.filter = {
        or: [
          {
            property: 'Title',
            rich_text: {
              contains: search,
            },
          },
          {
            property: 'Artist',
            rich_text: {
              contains: search,
            },
          },
        ],
      };
    }
    
    // 查询数据库
    const response = await notion.databases.query(query);
    
    // 处理结果
    const songs = response.results.map(page => {
      const properties = page.properties;
      return {
        id: page.id,
        title: properties.Title?.title[0]?.plain_text || '未知歌曲',
        artist: properties.Artist?.rich_text[0]?.plain_text || '未知歌手',
        url: properties.URL?.url || '',
        lrc: properties.Lyrics?.url || '',
        cover: properties.Cover?.files[0]?.file?.url || '',
        album: properties.Album?.rich_text[0]?.plain_text || '',
        tags: properties.Tags?.multi_select?.map(tag => tag.name) || []
      };
    }).filter(song => song.url); // 过滤掉没有 URL 的歌曲
    
    // 返回结果
    res.status(200).json({
      name: '我的 Notion 音乐库',
      songs
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: '获取 Notion 数据失败' });
  }
};