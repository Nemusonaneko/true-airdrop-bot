import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
} from "discord.js";
import { bot, channel_id } from "./config.json";
import * as path from "path";
import * as fs from "fs";
import { findUser } from "./utils/sql";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    const command = interaction.client.commands.get(interaction.commandName);
    await command.execute(interaction);
  } catch (error) {
    console.error(`[ERROR] Error executing command: ${error}`);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.ClientReady, async () => {
  try {
    const channel: any = await client.channels.cache.get(channel_id);
    if (!channel) return;
    const row = new ActionRowBuilder();
    row.components.push(
      new ButtonBuilder()
        .setCustomId("check_user_id")
        .setLabel("Check")
        .setStyle(ButtonStyle.Primary)
    );
    channel.send({
      content: "Check your airdrop here.",
      components: [row],
    });
  } catch (error) {
    console.log(`[ERROR] Error creating airdrop check button: ${error}`);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    if (interaction.channelId !== channel_id) return;
    const buttonId = interaction.customId;
    if (buttonId !== "check_user_id") return;
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const dbCheck = await findUser(userId);
    if (dbCheck.length > 0) {
      const entry = dbCheck[0];
      interaction.followUp({
        content: `Congrats! You are eligible for the airdrop!\n\n${
          entry.wallet_address
            ? `Your current wallet address: ${entry.wallet_address} (You can still edit it by using /register)`
            : `Please add your wallet address by using the /register command.`
        }`,
      });
    } else {
      interaction.followUp({
        content: "You are not eligible :sob:",
      });
    }
  } catch (error) {
    console.log(`[ERROR] Error with button: ${error}`);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.channelId !== channel_id) return;
  try {
    if (message.author.id === bot.client_id) return;
    await message.delete();
  } catch (error) {
    console.error(`[ERROR] Error deleting unrelated message: ${error}`);
  }
});

client.login(bot.token);
