const pool = require('../config/database');
const CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const axios = require('axios');


async function insertComponentHistory(designDetails, interactivity, stateManagement, libraries, generatedComponent) {
    
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO component_history (design_details, interactivity, state_management, libraries, generated_component)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const values = [designDetails, interactivity, stateManagement, libraries, generatedComponent];
      const result = await client.query(query, values);
      console.log(`Inserted component history with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

exports.generateComponent = async (req, res) => {
    console.log("Generating component");
    try {
        const { designDetails, interactivity, stateManagement, libraries } = req.body;
        // Add a check for req.file
        if (!req.file) {
            return res.status(400).json({ error: "No image file uploaded" });
        }
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
          Include any necessary imports and ensure the component is well-structured and follows best practices including comments and styling.
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

        insertComponentHistory(designDetails, interactivity, stateManagement, libraries, generatedComponent);

        res.status(201).json({component:generatedComponent});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
  };

async function fetchRecentHistory(limit = 12) {
const client = await pool.connect();
try {
    const query = `
    SELECT id, design_details, interactivity, state_management, libraries, 
            substring(generated_component, 1, 100) as component_preview, 
            created_at
    FROM component_history
    ORDER BY created_at DESC
    LIMIT $1;
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
} finally {
    client.release();
}
}
exports.getRecentComponents = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 12;
      const recentHistory = await fetchRecentHistory(limit);
      
      res.json({
        success: true,
        data: recentHistory
      });
    } catch (error) {
      console.error('Error fetching recent history:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching recent history',
        error: error.message
      });
    }
  };
