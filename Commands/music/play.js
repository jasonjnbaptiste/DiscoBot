const { createAudioResource, joinVoiceChannel, createAudioPlayer, AudioPlayerStatus, StreamType, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const { SlashCommandBuilder } = require('discord.js');
const ytdl = require('ytdl-core');
const queue = require('./queue');

module.exports = {
  data : new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a a YouTube URL, or add it to the queue.')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('YouTube URL')
        .setRequired(true)),
  async execute(interaction) {
    const url = interaction.options.getString('url');
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.reply('Join a voice channel first!');

    const serverQueue = queue.get(interaction.guildId);
    if (serverQueue) {
      serverQueue.audios.push({ url, requestedBy: interaction.user });
      return interaction.reply(`🎶 Added to queue: ${url}\n💡 Requested by: ${interaction.user}`);
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    const player = createAudioPlayer();
    const audioQueue = {
      connection,
      player,
      audios: [{ url, requestedBy: interaction.user }],
    };
    queue.set(interaction.guildId, audioQueue);

    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      audioQueue.audios.shift();
      if (audioQueue.audios.length) {
        playAudio(interaction.guildId);
      }
      else {
        connection.destroy();
        queue.delete(interaction.guildId);
      }
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
    playAudio(interaction.guildId);
    await interaction.reply(`🎵 Now playing: ${url}\n💡 Requested by: ${interaction.user}`);
  },
};

async function playAudio(guildId) {
  const serverQueue = queue.get(guildId);
  if (!serverQueue || !serverQueue.audios.length) return;

  const audio = serverQueue.audios[0];
  const stream = ytdl(audio.url, { filter: 'audioonly' });
  const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });

  serverQueue.player.play(resource);
}