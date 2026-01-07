const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIInsight(
  prompt: string,
  context?: Record<string, any>
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return getFallbackMessage(context);
  }

  try {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a motivational life coach and productivity expert helping 9-5 professionals optimize their lives.
Be encouraging, specific, and actionable. Keep responses concise (2-3 sentences).
Focus on practical advice and positive reinforcement.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://lifeos.app',
        'X-Title': 'Life OS',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || getFallbackMessage(context);
  } catch (error) {
    console.error('Error generating AI insight:', error);
    return getFallbackMessage(context);
  }
}

function getFallbackMessage(context?: Record<string, any>): string {
  const messages = [
    'Every step forward, no matter how small, is progress. Keep going!',
    'Your consistency today builds the success of tomorrow. Stay focused!',
    'The fact that you\'re here shows you\'re committed to growth. That\'s powerful!',
    'Small daily improvements lead to stunning long-term results. You\'ve got this!',
    'Your future self will thank you for the work you\'re putting in today.',
    'Excellence is not an act, but a habit. You\'re building that habit right now.',
    'The only way to do great work is to love what you do. Keep pursuing your goals!',
    'Success is the sum of small efforts repeated day in and day out.',
  ];

  if (context?.completionRate && context.completionRate > 70) {
    return 'Outstanding progress today! Your dedication is truly inspiring. Keep this momentum going!';
  }

  if (context?.currentStreak && context.currentStreak > 7) {
    return `${context.currentStreak} days strong! Your consistency is remarkable. This is how champions are made!`;
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

export async function generateDailyMotivation(userData: {
  completedTasks: number;
  totalTasks: number;
  activeGoals: number;
  longestStreak: number;
}): Promise<string> {
  const { completedTasks, totalTasks, activeGoals, longestStreak } = userData;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const prompt = `Generate a brief, motivational message for a professional who:
- Completed ${completedTasks} out of ${totalTasks} tasks today (${completionRate.toFixed(0)}% completion rate)
- Has ${activeGoals} active 90-day goals
- Has a longest habit streak of ${longestStreak} days

Keep it encouraging, specific to their progress, and actionable. Max 2-3 sentences.`;

  return generateAIInsight(prompt, { completionRate, longestStreak });
}

export async function generateWeeklyReview(userData: {
  tasksCompleted: number;
  goalsProgress: number;
  habitsCompleted: number;
}): Promise<string> {
  const { tasksCompleted, goalsProgress, habitsCompleted } = userData;

  const prompt = `Generate a weekly review message for a professional who this week:
- Completed ${tasksCompleted} tasks
- Made ${goalsProgress}% average progress on goals
- Completed ${habitsCompleted} habit check-ins

Provide 2-3 sentences of encouragement and one actionable suggestion for next week.`;

  return generateAIInsight(prompt);
}

export async function generateGoalAdvice(goal: {
  title: string;
  category: string;
  progress: number;
  daysRemaining: number;
}): Promise<string> {
  const { title, category, progress, daysRemaining } = goal;

  const prompt = `Give advice for someone working on this ${category} goal: "${title}"
Current progress: ${progress}%
Days remaining: ${daysRemaining}

Provide 2-3 sentences of specific, actionable advice to help them succeed.`;

  return generateAIInsight(prompt);
}
