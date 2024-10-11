import { SlashCommandBuilder } from "discord.js";
import { findUser, submitUserAddress } from "../../utils/sql";

const evmRegex = /^(0x)?[0-9a-fA-F]{40}$/;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your address for airdrop.")
    .addStringOption((option) =>
      option.setName("address").setDescription("Address").setRequired(true)
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const userId = interaction.user.id;
      const dbCheck = await findUser(userId);
      if (dbCheck.length > 0) {
        const userAddress = interaction.options.getString("address");
        const regex = new RegExp(evmRegex);
        if (regex.test(userAddress)) {
          await submitUserAddress(userId, userAddress.toLowerCase());
          interaction.followUp({
            content: `You have registered: ${userAddress}`,
          });
        } else {
          interaction.followUp({
            content: "Invalid address. Try again.",
          });
        }
      } else {
        interaction.followUp({
          content: "You aren't eligible :sob:",
        });
      }
    } catch (error) {
      console.error(`[ERROR] Error registering address: ${error}`);
      interaction.followUp({
        content: "Error registering address",
      });
    }
  },
};
