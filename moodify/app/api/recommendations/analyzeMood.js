export async function analyzeMood(prompt) {
  try {
    console.log("Analyzing mood for prompt:", prompt);
    
    const response = await fetch('http://54.152.238.168:8000/analyze-mood', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        text: prompt
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if there's an error in the response
    if (data.error) {
      console.error('FastAPI error:', data.error);
      return "balanced";
    }

    // Extract mood from the analysis
    const moodAnalysis = data.mood_analysis || "";
    console.log("Received mood analysis:", moodAnalysis);
    
    // Parse the mood analysis to extract a single mood keyword
    return moodAnalysis;
    
  } catch (error) {
    console.error('Error analyzing mood:', error);
    return "balanced";
  }
}
