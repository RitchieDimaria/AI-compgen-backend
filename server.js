const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';

app.post('/generate-component', upload.single('image'), async (req, res) => {
  try {
    const { designDetails, interactivity, stateManagement, libraries } = req.body;
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');

    const prompt = `
      Generate a React component based on the following details:
      
      Image: [A base64 encoded image will be provided]
      Design Details: ${designDetails}
      Interactivity: ${interactivity}
      State Management: ${stateManagement}
      Preferred Libraries: ${libraries}
      
      Please create a complete, functional React component that matches the provided image and specifications.
      Include any necessary imports and ensure the component is well-structured and follows best practices.
      ONLY RETURN THE COMPONENT CODE, NO OTHER TEXT.
    `;

    const response = await axios.post(
      CLAUDE_API_ENDPOINT,
      {
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64Image } }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const generatedComponent = response.data.content[0].text;
    res.json({ component: generatedComponent });
  } catch (error) {
    console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    res.status(500).json({ error: 'An error occurred while generating the component' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '::',() => {
  console.log(`Server running on port [::]${PORT}`);
});