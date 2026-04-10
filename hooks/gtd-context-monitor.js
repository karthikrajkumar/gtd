/**
 * GTD Context Monitor Hook — Warns when context window usage is high.
 *
 * Hook type: PostToolUse / AfterTool
 * Injects advisory warnings at 35% and 25% remaining context.
 */

'use strict';

module.exports = {
  event: 'PostToolUse',
  handler: (context) => {
    if (!context || !context.contextWindow) return;

    const { used, total } = context.contextWindow;
    const remaining = ((total - used) / total) * 100;

    if (remaining < 25) {
      return {
        advisory: true,
        message: `⚠ GTD: Context window critically low (${remaining.toFixed(0)}% remaining). Consider /clear and resume.`,
      };
    } else if (remaining < 35) {
      return {
        advisory: true,
        message: `GTD: Context window at ${remaining.toFixed(0)}% remaining. Consider completing current task soon.`,
      };
    }

    return null;
  },
};
