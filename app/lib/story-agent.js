require('dotenv').config();
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// 環境變數驗證
const mistralApiKey = process.env.MISTRAL_API_KEY;
if (!mistralApiKey) {
  throw new Error('MISTRAL_API_KEY is missing. Please set it in your .env file.');
}

// 初始化 LLM
const llm = new ChatMistralAI({
  model: 'mistral-large-latest',
  apiKey: mistralApiKey,
  temperature: 0.8,
  maxRetries: 2,
});

// 爬取 KKBOX 歌曲 URL
export async function kkbox(artist, song) {
  try {
    console.log(artist,song)
    const query = encodeURIComponent(`${artist} ${song}`);
    const url = `https://www.kkbox.com/api/search/song?q=${query}&terr=tw&lang=tc`;
    const headers = { 'User-Agent': 'Mozilla/5.0' };

    const response = await axios.get(url, { headers });
    if (response.status !== 200 || !response.data?.data?.result?.length) {
      return null; // 返回 null 表示未找到
    }

    return response.data.data.result[0].url;
  } catch (error) {
    console.error('KKBOX API error:', error.message);
    return null;
  }
}

// 爬取歌詞（假設從 KKBOX 頁面解析，需確認是否可行）
export async function getLyrics(url) {
  if (!url) return '無效的歌曲 URL';

  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    const response = await axios.get(url, { headers });
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // 假設 KKBOX 頁面有歌詞區塊（需根據實際頁面結構調整）
    const lyricsDiv = document.querySelector('.lyrics'); // 需確認選擇器
    if (!lyricsDiv) return '找不到歌詞區塊';
    if (lyricsDiv) {
        const paragraphs = lyricsDiv.querySelectorAll('p');
        const lyrics = Array.from(paragraphs).map(p => p.textContent.trim());
    } else {
        console.log("未找到歌詞區塊");
    }
    const lyrics = lyricsDiv.textContent.trim();
    return lyrics || '歌詞內容為空';
  } catch (error) {
    console.error('Lyrics scraping error:', error.message);
    return '無法獲取歌詞';
  }
}

// 提取 JSON 數據
export function extractJson(text) {
  try {
    const match = text.match(/{[\s\S]*}/);
    if (!match) throw new Error('No valid JSON found');
    return JSON.parse(match[0]);
  } catch (error) {
    console.error('JSON extraction error:', error.message);
    throw new Error('Failed to parse JSON response');
  }
}

// StoryTool 類
export class StoryTool {
  name = 'story';
  description = '根據指定的藝術家和歌曲以及使用者的指定故事元素，產生一段故事';

  schema = {
    type: 'object',
    properties: {
      artist: { type: 'string', description: '藝術家或樂團名稱' },
      song: { type: 'string', description: '歌曲名稱' },
      customStory: { type: 'string', description: '故事元素' },
    },
    required: ['artist', 'song'],
  };
}