import { OpenAI } from 'openai';

const BASE_PROMPT = `
You are a data analyst that is tasked with summarizing and compiling user sentiment about a course.
You will be given a list of reddit posts and comments about a course and your job is to summarize the general sentiment of the course. 
Give a course a total likeness score from 1-10, difficulty from 1-10, and workload from 1-10.
Mention courses that are often taken, and courses that are often recommended AGAINST taking at the same time.
Give a brief summary of the sentiment.
`;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function getEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return response.data[0].embedding;
}

export async function summarizeInfo(text: string): Promise<string> {
    const prompt = `
    ${BASE_PROMPT}
    ${text} 
    `;
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: prompt,
            },
            {
                role: 'system',
                content: BASE_PROMPT
            },
        ],
        temperature: 0,
    });
    return response.choices[0].message.content || "";
}




