import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

export const getOpenAIClient = (apiKey: string): OpenAI => {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  } else if (openaiInstance.apiKey !== apiKey) {
    openaiInstance = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  
  return openaiInstance;
};

export const callChatCompletion = async (
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-3.5-turbo'
): Promise<string> => {
  const openai = getOpenAIClient(apiKey);
  
  const response = await openai.chat.completions.create({
    model,
    messages: messages as any,
  });
  
  return response.choices[0]?.message?.content || '';
};
