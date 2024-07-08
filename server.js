const express = require('express');
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require('@google/generative-ai');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 3000;

const genAI = new GoogleGenerativeAI('AIzaSyC44nYz2oepH8PRM8BbfbQ-HspntKo3vMQ');

app.use(express.static('public'));
app.use(bodyParser.json());

app.post('/chat', async (req, res) => {
  const { query } = req.body;
  try {
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', safetySettings, systemInstruction: `
      Answer length: Extremely concise
      Music playing capabilities: enabled
      Song playing format: "Sure, here's %%{SONG}%% by %%{ARTIST}%%" - Replace {SONG} with song name and {ARTIST} with artist name. You MUST ALWAYS fill out SONG and ARTIST - under NO CONDITIONS SAY the words Song and Artist. Do not say Song by Artist DO NOT DO THIS IF THE USER HAS NOT ASKED FOR MUSIC. THIS IS A MUSIC SPECIFIC RESPONSE.
      If unsure should I return Song by Artist: NO, NEVER
      Include percentage symbols: true
      Artist playing format "Sure, here's ¬¬{ARTIST}¬¬" - Replace {ARTIST} with artist name
      Include ¬s: true
      Use emojis: NEVER
      Use asterisks: NEVER
      Responses: Extremely short

      Always prioritise getting a 'good enough' response. If you don't have live information, give the most recent you have. Never EVER decline a response because you don't think you can answer it.
      ` });
    const result = await model.generateContent([{ text: query }]);
    let responseText = result.response.text();

    detect = responseText.split("%%")
    if (detect.length > 1) {
      let videoId = ""
      await fetch("https://music.youtube.com/search?q=" + detect[1] + "+" + detect[3], {
          headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
          }
      })
      .then(response => response.text())
      .then(data => {
          videoId = data.split("videoId")[1].split("\\x22:\\x22")[1].split("\\")[0];
          responseText = responseText + " %%" + videoId + "%%"
      });
    }

    detect = responseText.split("¬¬")
    if (detect.length > 1) {
      let videoId = ""
      await fetch("https://music.youtube.com/search?q=" + detect[1], {
          headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
          }
      })
      .then(response => response.text())
      .then(data => {
          videoId = data.split("videoId")[1].split("\\x22:\\x22")[1].split("\\")[0];
          responseText = responseText + " ¬¬" + videoId + "¬¬"
      });
    }

    res.json({ response: responseText });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get response from Gemini' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
