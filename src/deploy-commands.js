const {
  REST, Routes, SlashCommandBuilder, PermissionFlagsBits
}
= require("discord.js");
const cmds=[];
const add=(name,desc)=>{
  const c=new SlashCommandBuilder().setName(name).setDescription(desc);
  cmds.push(c);
  return c
};
add("profile","Kompletný Red Void profil");
add("rank","Level, XP a Void Power");
add("leaderboard","XP leaderboard");
add("balance","Void Points");
add("daily","Denná odmena a streak");
add("pay","Pošle Void Points").addUserOption(o=>o.setName("user").setDescription("Príjemca").setRequired(true)).addIntegerOption(o=>o.setName("amount").setDescription("VP").setMinValue(1).setRequired(true));
add("alignment","Void Alignment");
add("relics","Void Relics");
add("achievements","Achievements");
add("titles","Void Titles");
add("title","Nastaví titul").addStringOption(o=>o.setName("name").setDescription("Názov titulu").setRequired(true));
add("classes","Void Classes");
add("class","Vyberie Void Class").addStringOption(o=>o.setName("name").setDescription("Class").setRequired(true));
add("factions","Void Factions");
add("faction","Vyberie Void Faction").addStringOption(o=>o.setName("name").setDescription("Faction").setRequired(true));
add("bounties","Denné Bounties");
add("bounty","Splní bounty").addStringOption(o=>o.setName("id").setDescription("ID bounty").setRequired(true));
add("rift","Aktuálny Void Rift");
add("rift-join","Vstúpi do Riftu");
add("boss","Aktuálny Void Boss");
add("attack","Útok na Boss");
add("shop","Void Shop");
add("buy","Kúpi item").addStringOption(o=>o.setName("item").setDescription("ID itemu").setRequired(true));
add("event","Aktuálny Void Event");
add("roll","Void Dice 1-100");
add("curse","Aktuálna Void Curse");
add("fate","The Void Chooses");
add("map","Void Map");
add("explore","Preskúma Void");
add("quest","Random Void Quest");
add("war","Faction War");
add("whisper","Vyžiada Void Whisper");
add("ritual","Spustí denný Void Ritual");
add("reputation","Faction reputation");
add("collection","Kompletná zbierka");
add("streak","XP/Daily streak");
add("cooldowns","Tvoje cooldowny");
add("help","Kompletný Red Void command center");
add("void","Stav tvojho Voidu");
add("contracts","Denné Void Contracts");
add("trial","Denný Void Trial");
add("trial-claim","Vyzdvihni odmenu za Void Trial");
add("duel","Vyzve hráča na Void Duel").addUserOption(o=>o.setName("user").setDescription("Súper").setRequired(true));
add("evolution","Tvoja Void Evolution");
add("corruption","Tvoja Void Corruption");
add("legacy","Void Legacy");
add("season","Aktuálna sezóna");
add("clear","Vymaže správy").addIntegerOption(o=>o.setName("amount").setDescription("1-100").setMinValue(1).setMaxValue(100).setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
add("warn","Udelí warning").addUserOption(o=>o.setName("user").setDescription("Člen").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Dôvod").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
add("warnings","Zobrazí warningy").addUserOption(o=>o.setName("user").setDescription("Člen").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
add("setup-level-roles","Vytvorí všetky level role po 5 leveloch").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
add("setup-roles","Vytvorí Red Void achievement role").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
add("server-stats","Štatistiky Red Void servera").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
add("bot-control","Bot Control a posledné príkazy").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
add("command-log","Zobrazí posledné použité príkazy").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);
add("timeout","Timeout").addUserOption(o=>o.setName("user").setDescription("Člen").setRequired(true)).addIntegerOption(o=>o.setName("minutes").setDescription("Minúty").setMinValue(1).setMaxValue(40320).setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
const token=process.env.DISCORD_TOKEN, clientId=process.env.CLIENT_ID, guildId=process.env.GUILD_ID;
if(!token||!clientId||!guildId) throw new Error("CLIENT_ID a GUILD_ID sú povinné.");
new REST({
  version:"10"
}).setToken(token).put(Routes.applicationGuildCommands(clientId,guildId),{
  body:cmds.map(c=>c.toJSON())
})
.then(()=>console.log(`🔴 RED VOID v4 • Registrovaných ${cmds.length} príkazov.`))
.catch(console.error);
