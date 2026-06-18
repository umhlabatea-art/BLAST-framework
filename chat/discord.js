/**
 * Discord adapter for the chat command router.
 *
 * Lazy-loads `discord.js` (an optional dependency) so the rest of the project
 * runs without it. Hermes results are posted in a thread off the triggering
 * message; everything else replies inline.
 *
 * The same `router` works for a Slack adapter — only this transport wiring
 * differs.
 */
export async function startDiscordBot({ token, router, prefix = "!" }) {
  if (!token) throw new Error("DISCORD_BOT_TOKEN is required");
  if (!router) throw new Error("router is required");

  const { Client, GatewayIntentBits, Events } = await import("discord.js");
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author?.bot) return;
    if (!message.content?.startsWith(prefix)) return;
    let response;
    try {
      response = await router.handle(message.content);
    } catch (err) {
      response = { text: `⚠️ ${err.message}` };
    }
    if (!response) return;

    try {
      if (response.thread && typeof message.startThread === "function") {
        const thread = await message.startThread({
          name: `Hermes — ${message.content.slice(0, 40)}`,
          autoArchiveDuration: 60,
        });
        await thread.send(response.text);
      } else {
        await message.reply(response.text);
      }
    } catch (err) {
      // Surface send failures without crashing the bot.
      console.error("[discord] reply failed:", err.message);
    }
  });

  await client.login(token);
  console.error("[discord] bot online.");
  return client;
}
