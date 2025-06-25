const { createAudioResource, joinVoiceChannel, createAudioPlayer, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const { SlashCommandBuilder } = require('discord.js');
const ytdl = require('ytdl-core');

module.exports = {
  data : new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a url.')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('The url to play')
        .setRequired(true)),
  async execute(interaction) {
    const url = interaction.options.getString('url');
    console.log(url);
    const stream = ytdl(url, { filter: 'audioonly' });
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) return interaction.reply('Join a voice channel first!');

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    const player = createAudioPlayer();
    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => connection.destroy());
    await interaction.reply(`Now playing ${url}, requested by ${interaction.user}`);
  },
};