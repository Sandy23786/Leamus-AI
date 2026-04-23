/**
 * AI Reply Generator
 * In production, replace with real Anthropic API calls.
 */

export function getAIReply(mode, userMessage) {
  const msg = userMessage.toLowerCase();

  switch (mode) {
    case 'write':   return getWritingReply(msg, userMessage);
    case 'code':    return getCodeReply(msg, userMessage);
    case 'data':    return getDataReply(msg, userMessage);
    case 'research':return getResearchReply(msg, userMessage);
    default:        return getChatReply(msg, userMessage);
  }
}

function getChatReply(msg, original) {
  if (msg.includes('hello') || msg.includes('hi')) {
    return `Hello! I'm **Leamus AI**, your intelligent assistant. I can help you with:\n\n• **Writing** – emails, blogs, reports, stories\n• **Coding** – write, debug, explain code in any language\n• **Analysis** – interpret data and extract insights\n• **Research** – up-to-date information and summaries\n\nWhat would you like to work on today?`;
  }
  if (msg.includes('who are you') || msg.includes('what are you')) {
    return `I'm **Leamus AI** — a powerful, multi-purpose AI assistant designed to boost your productivity.\n\nI specialise in:\n• 📝 **Content creation** – professional writing for any context\n• 💻 **Technical support** – coding in 20+ languages\n• 📊 **Data analysis** – turning raw numbers into insights\n• 🔍 **Research** – fast, comprehensive information retrieval\n\nSwitch modes using the pills at the top to unlock specialised capabilities!`;
  }
  return `Great question! Here's what I can tell you about *"${original.slice(0, 60)}${original.length > 60 ? '…' : ''}"*:\n\nThis is a topic I'm well-equipped to assist with. Based on the context, I'd suggest breaking this down into key components:\n\n• **First**, consider the core objective and desired outcome\n• **Second**, identify any constraints or dependencies\n• **Third**, outline a step-by-step approach\n\nWould you like me to go deeper on any particular aspect, or shall I draft a full response?`;
}

function getWritingReply(msg, original) {
  if (msg.includes('email') || msg.includes('cold')) {
    return `Here's your professional email draft:\n\n---\n**Subject:** [Compelling subject line here]\n\nHi [First Name],\n\nI hope this message finds you well. I'm reaching out because [specific reason tied to their business].\n\n[1–2 sentences establishing credibility/context]\n\n[Core value proposition — what's in it for them, concisely]\n\nI'd love to explore whether there's a fit. Would you be open to a quick 15-minute call this week?\n\nBest regards,\n[Your name]\n[Title · Company · Phone]\n\n---\n\n**Want me to adjust?** I can make it more formal, add social proof, shorten it, or tailor it for a specific industry.`;
  }
  if (msg.includes('blog') || msg.includes('article') || msg.includes('post')) {
    return `Here's a blog post outline and intro for you:\n\n---\n**Title:** [Attention-grabbing headline]\n**Subtitle:** [Supporting context]\n\n**Introduction**\n[Hook — a surprising statistic, bold claim, or relatable problem]\n\n[2–3 sentences establishing why this matters to the reader]\n\n**What You'll Learn:**\n• Section 1: [Key point]\n• Section 2: [Key point]\n• Section 3: [Key point]\n• Conclusion + CTA\n\n---\n\nShall I write the full article? Also let me know the **target audience**, **tone** (professional/casual/inspirational), and preferred **word count**.`;
  }
  if (msg.includes('story') || msg.includes('fiction') || msg.includes('creative')) {
    return `Here's your creative story opening:\n\n---\n*The notification arrived at 3:17 AM — not that anyone was supposed to be awake to see it. But she was. She was always awake when the world crossed the line between what was and what couldn't be.*\n\n*She read the message twice. Then a third time. The words didn't change, but their meaning expanded with each reading, filling the room like smoke.*\n\n---\n\nI can continue this in any direction — thriller, romance, sci-fi, literary fiction. Just tell me **genre**, **main character**, and **central conflict** and I'll craft the full story.`;
  }
  return `Here's a polished draft for: *"${original.slice(0, 50)}…"*\n\n---\n**[Opening hook that grabs attention immediately]**\n\n[Body paragraph 1 — establish context and credibility]\n\n[Body paragraph 2 — core message with supporting detail]\n\n[Body paragraph 3 — address objections or nuance]\n\n**[Strong closing with a clear call-to-action]**\n\n---\n\nTone: Professional · Format: Can be adjusted · Length: ~250 words\n\nWant me to revise the **tone**, **length**, or **format**?`;
}

function getCodeReply(msg, original) {
  return '__CODE_BLOCK__';
}

function getDataReply(msg, original) {
  const hasNumbers = /\$[\d,]+|\d+k|\d+%/.test(original);
  if (hasNumbers) {
    return `**📊 Analysis Complete**\n\n---\n**Key Findings:**\n\n📈 **Trend** – Strong overall growth trajectory detected across the dataset\n🏆 **Peak Performance** – Highest values represent approximately 76% growth from baseline\n⚠️ **Anomaly Detected** – Mid-period dip of ~12% warrants investigation\n💡 **Forecast** – If current trend holds, next period projects +18–22% growth\n\n---\n**Recommendations:**\n\n• Replicate the strategies behind your peak-performance period\n• Investigate root causes of the mid-period dip\n• Set performance benchmarks based on top quartile data\n• Consider seasonality adjustments for more accurate forecasting\n\n---\n\nWant a **visual chart**, **deeper statistical breakdown**, or **export to CSV**?`;
  }
  return `**📊 Data Analysis Mode**\n\nI'm ready to analyze your data. For best results, please share:\n\n• **Raw data** – paste CSV, JSON, or plain text\n• **Context** – what does this data represent?\n• **Goal** – what insight are you looking for?\n\n**I can help with:**\n• Summarisation and key metrics\n• Trend identification and forecasting\n• Anomaly detection\n• Comparative analysis\n• Recommendations based on findings`;
}

function getResearchReply(msg, original) {
  return `**🔍 Research Summary: *${original.slice(0, 50)}${original.length > 50 ? '…' : ''}***\n\n---\n**Overview**\nThis topic has seen significant developments, with multiple high-credibility sources converging on key themes.\n\n**Key Findings:**\n\n• **Finding 1** – [Primary insight with supporting evidence]\n• **Finding 2** – [Secondary trend or data point]\n• **Finding 3** – [Contrasting perspective or nuance]\n• **Finding 4** – [Emerging development or forward-looking insight]\n\n**Expert Consensus:**\nLeading researchers and analysts generally agree that [synthesis of mainstream view], though some debate exists around [area of contention].\n\n**Sources to explore:**\n• Academic papers via Google Scholar\n• Industry reports (Gartner, McKinsey, etc.)\n• Primary sources and official documentation\n\n---\n\n*Want me to go deeper on any finding, generate a bibliography, or write a full research report?*`;
}
