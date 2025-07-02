const { SlashCommandBuilder } = require('discord.js');
const queue = require('./queue');

module.exports = {
  data : new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip current audio playing.'),
  async execute(interaction) {
    const serverQueue = queue.get(interaction.guildId);
    if (!serverQueue) {
      return interaction.reply('❌ No audio currently playing.');
    }

    if (serverQueue.audios.length <= 1) {
      serverQueue.player.stop();
      return interaction.reply('⏭️ Skipping ...  queue is now empty.');
    }

    const skipped = serverQueue.audios[0];
    serverQueue.player.stop();

    return interaction.reply(`⏭️Skipped ${skipped.url}\n💡 Skipped by: ${interaction.user}`);
  },
};