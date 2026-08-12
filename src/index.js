const fs=require("fs"),path=require("path"),crypto=require("crypto");
const express=require("express");
const {
  Client,GatewayIntentBits,Partials,EmbedBuilder,PermissionsBitField
}
=require("discord.js");
const DATA=path.join(__dirname,"..","data"),DBFILE=path.join(DATA,"db.json");
if(!fs.existsSync(DATA))fs.mkdirSync(DATA,{
  recursive:true
});
const blank={
  users:{
  },warnings:{
  },event:null,rift:null,boss:null,war:null,ritual:null,meta:{
    lastEvent:0,lastRift:0,lastBoss:0,lastWar:0,lastRitual:0
  },commandLogs:[]
};
let db=fs.existsSync(DBFILE)?JSON.parse(fs.readFileSync(DBFILE,"utf8")):structuredClone(blank);
db={
  ...blank,...db,users:db.users||{
  },warnings:db.warnings||{
  },commandLogs:Array.isArray(db.commandLogs)?db.commandLogs:[]
};
let saveTimer;
function save(){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>fs.writeFileSync(DBFILE,JSON.stringify(db,null,2)),250)
}
const now=()=>Date.now(), today=()=>new Date().toISOString().slice(0,10), rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
function U(id){
  db.users[id]??=({
    xp:0,level:1,vp:0,messages:0,lastXP:0,lastVP:0,lastDaily:"",streak:0,alignment:{
      Blood:0,Shadow:0,Flame:0,Vision:0,Chaos:0,Time:0,Void:0
    },relics:[],achievements:[],titles:[],activeTitle:"",class:"",faction:"",rep:{
    },bounties:{
    },rifts:0,bossDamage:0,explores:0,rolls:0,whispers:0,rituals:0,fateUses:0,contracts:0,duels:0,duelWins:0,corruption:0,legacy:0,seasonXP:0,curse:null,trialClaimed:"",trialDate:"",trialStart:{messages:0,rolls:0,explores:0},cooldowns:{
    }
  });
  return normalizeUser(db.users[id]);
}
function normalizeUser(u){
  if(u.fateUses==null)u.fateUses=0;
  if(!u.rep)u.rep={};
  if(!u.relics)u.relics=[];
  if(!u.achievements)u.achievements=[];
  return u;
}
const need=l=>l*Number(process.env.XP_PER_LEVEL||100);
const totalXP=u=>{
  let n=u.xp;
  for(let l=1;
  l<u.level;
  l++)n+=need(l);
  return n
};
const align=u=>Object.entries(u.alignment).sort((a,b)=>b[1]-a[1])[0][0];
const classes={
  Warden:{
    e:"⚔️",d:"+10% boss damage"
  },Seer:{
    e:"🔮",d:"+15% relic chance"
  },Bloodborn:{
    e:"🩸",d:"+20% event VP"
  },Shadow:{
    e:"🌒",d:"+25% XP during Shadow/Blood Moon"
  },Flameborn:{
    e:"🔥",d:"+10% XP"
  },Voidwalker:{
    e:"🌀",d:"+10% Rift rewards"
  }
};
const factions={
  Wardens:{
    e:"⚔️",d:"Guardians of the Void"
  },Shadows:{
    e:"🌒",d:"Silent hunters"
  },Seers:{
    e:"🔮",d:"Future seekers"
  },Bloodbound:{
    e:"🩸",d:"Blood oath"
  },Walkers:{
    e:"🌀",d:"Wanderers"
  }
};
const titles=["RIFTWALKER","BLOODBOUND","THE WATCHER","VOID TOUCHED","SHADOWBORN","THE LAST FRAGMENT","CHILD OF THE ABYSS","THE UNNAMED","THE CHOSEN","RED HERALD","KEEPER OF RIFTS"];
const relics=["Blood Crystal","Void Fragment","Shadow Sigil","Seer's Orb","Warden's Sigil","Heart Shard","Eye of the Void","Broken Chronometer"];
const achievements={
  first:"🕳️ First Descent",lvl10:"⚡ Beyond Level Ten",daily7:"🔥 Seven Days",relic:"💎 Relic Hunter",rift:"🌀 Riftwalker",boss:"⚔️ Boss Hunter",vp1000:"🔮 Void Fortune",fate:"👁️ The Void Knows",explore:"🗺️ Beyond the Gate",roll:"🎲 Void Gambler",whisper:"👁️ Void Listener",ritual:"🕯️ Ritual Keeper",class:"⚔️ Chosen Path",faction:"🏛️ Factionbound"
};
function award(id,k){
  const u=U(id);
  if(!u.achievements.includes(k)&&achievements[k]){
    u.achievements.push(k);
    return true
  }
  return false
}
function emb(t,d,c="#E00000"){
  return new EmbedBuilder().setColor(c).setTitle(t).setDescription(d).setTimestamp()
}
function bossHpBar(hp,maxHp,size=18){
  const ratio=maxHp>0?Math.max(0,Math.min(1,hp/maxHp)):0;
  const filled=Math.round(ratio*size);
  return `╔${"═".repeat(size)}╗\n║${"█".repeat(filled)}${"░".repeat(size-filled)}║\n╚${"═".repeat(size)}╝`;
}
function bossHpPercent(hp,maxHp){
  return maxHp>0?Math.round(Math.max(0,Math.min(1,hp/maxHp))*100):0;
}
function imageEmbed(t,d,c="#E00000",imageUrl=null,thumbnailUrl=null){
  const e=emb(t,d,c);
  if(imageUrl)e.setImage(imageUrl);
  if(thumbnailUrl)e.setThumbnail(thumbnailUrl);
  return e;
}
function serverBanner(guild){
  return guild?.bannerURL?.({extension:"png",size:1024}) || process.env.WELCOME_BANNER_URL || null;
}
function staticAssetAttachment(fileName,displayName=fileName){
  const filePath=path.join(__dirname,"..","assets",fileName);
  if(!fs.existsSync(filePath))return null;
  return new AttachmentBuilder(filePath,{name:displayName});
}
function bossAssetKey(name="THE RED ABYSS"){
  const n=String(name).toUpperCase();
  if(n.includes("VOID EATER"))return "void_eater";
  if(n.includes("WATCHER"))return "watcher";
  if(n.includes("RED GOD"))return "red_god";
  return "red_abyss";
}
function bossAssetFile(name,kind="hp"){
  return `boss_${bossAssetKey(name)}_${kind}.${kind==="hp"?"gif":"png"}`;
}
function commandImage(envName,fallback=null){
  return process.env[envName] || fallback || null;
}
const LEVEL_ROLES = {
  5:{name:"🩸 Void Initiate",color:0x8B0000,old:["New Fragment"]},
  10:{name:"⚡ Void Awakened",color:0xFF4500,old:["Level 10","⚡ Void Awakened"]},
  15:{name:"🌒 Void Walker",color:0x7B1E1E,old:["Void Walker"]},
  20:{name:"🔮 Void Seeker",color:0x8A2BE2,old:["Void Seeker"]},
  25:{name:"🌑 Void Veteran",color:0x6A0DAD,old:["Level 25","🌑 Void Veteran"]},
  30:{name:"🌀 Riftborn",color:0x4169E1,old:["Riftborn"]},
  35:{name:"👁️ Void Watcher",color:0x800080,old:["The Watcher","Void Watcher"]},
  40:{name:"💀 Abyss Marked",color:0x4B0082,old:["Abyss Marked"]},
  45:{name:"🔥 Voidforged",color:0xFF4500,old:["Voidforged"]},
  50:{name:"👑 Void Elite",color:0xFFD700,old:["Level 50","👑 Void Elite"]},
  55:{name:"🩸 Bloodbound",color:0x8B0000,old:["Bloodbound"]},
  60:{name:"🌌 Void Master",color:0x483D8B,old:["Void Master"]},
  65:{name:"🕳️ Abyss Walker",color:0x301934,old:["Abyss Walker"]},
  70:{name:"⚔️ Void Warden",color:0x708090,old:["Void Warden"]},
  75:{name:"👁️ Void Ascendant",color:0x9400D3,old:["Void Ascendant"]},
  80:{name:"🌀 Rift Master",color:0x4169E1,old:["Rift Master"]},
  85:{name:"🔴 Red Herald",color:0xE00000,old:["Red Herald"]},
  90:{name:"💎 Void Relic Lord",color:0xBA55D3,old:["Relic Lord","Void Relic Lord"]},
  95:{name:"☠️ Deathless",color:0x696969,old:["Deathless"]},
  100:{name:"🔴 Red Void Legend",color:0xE00000,old:["Level 100","🔴 Red Void Legend"]}
};

const AUTO_ROLES = Object.fromEntries(
  Object.entries(LEVEL_ROLES).map(([lv,cfg])=>[`level${lv}`,cfg])
);

async function getOrCreateAutoRole(guild,key){
  const cfg=AUTO_ROLES[key];
  if(!cfg)return null;

  let role=guild.roles.cache.find(r=>r.name===cfg.name);
  if(role)return role;

  const me=guild.members.me;
  if(!me||!me.permissions.has(PermissionsBitField.Flags.ManageRoles)){
    console.warn(`RED VOID: Missing Manage Roles for ${cfg.name}`);
    return null;
  }

  try{
    return await guild.roles.create({
      name:cfg.name,
      color:cfg.color,
      hoist:true,
      mentionable:false,
      reason:`Red Void automatic role: ${cfg.name}`
    });
  }catch(err){
    console.error("RED VOID ROLE CREATE:",err);
    return null;
  }
}

async function getLevelRole(guild,level){
  const cfg=LEVEL_ROLES[level];
  if(!cfg)return null;

  const envId=process.env[`LEVEL_${level}_ROLE_ID`];
  if(envId){
    const role=guild.roles.cache.get(envId);
    if(role)return role;
  }

  for(const oldName of cfg.old||[]){
    const oldRole=guild.roles.cache.find(r=>r.name===oldName);
    if(oldRole)return oldRole;
  }

  return getOrCreateAutoRole(guild,`level${level}`);
}

async function syncLevelRole(member,level){
  if(!member?.guild||level<5)return null;
  const milestone=Math.floor(level/5)*5;
  const role=await getLevelRole(member.guild,milestone);
  if(!role)return null;

  const me=member.guild.members.me;
  if(!me||!me.permissions.has(PermissionsBitField.Flags.ManageRoles))return null;
  if(role.position>=me.roles.highest.position){
    console.warn(`RED VOID LEVEL ROLE: ${role.name} is above the bot role.`);
    return null;
  }

  if(!member.roles.cache.has(role.id)){
    await member.roles.add(role,`Red Void Level ${milestone}`).catch(err=>console.error("LEVEL ROLE:",err));
  }
  return role;
}

async function setupAllLevelRoles(guild){
  const out=[];
  for(const level of Object.keys(LEVEL_ROLES).map(Number)){
    const role=await getLevelRole(guild,level);
    if(role)out.push({level,role});
  }
  return out;
}

function relic(u){
  let p=Math.random()+(u.class==="Seer"?.15:0);
  return p<.02?relics[6]:p<.08?relics[5]:p<.18?relics[4]:p<.35?relics[3]:p<.55?relics[2]:p<.8?relics[1]:relics[0]
}
function event(){
  if(db.event&&now()<db.event.ends)return db.event;
  if(db.event&&now()>=db.event.ends)db.event=null;
  if(now()-(db.meta.lastEvent||0)>3*3600000&&Math.random()<.18){
    const x=[["BLOOD MOON","🌑","blood",3600000],["VOID SURGE","🌀","vp",1800000],["SHADOW HOUR","🌒","shadow",1800000],["DOUBLE XP","⚡","xp",1800000]][rnd(0,3)];
    db.event={
      name:x[0],emoji:x[1],type:x[2],ends:now()+x[3]
    };
    db.meta.lastEvent=now();
    save()
  }
  return db.event
}
function rift(){
  if(db.rift&&now()<db.rift.ends)return db.rift;
  if(db.rift&&now()>=db.rift.ends)db.rift=null;
  if(!db.rift&&now()-(db.meta.lastRift||0)>6*3600000&&Math.random()<.15){
    db.rift={
      id:Date.now().toString(36).toUpperCase(),hp:100,participants:[],ends:now()+3600000
    };
    db.meta.lastRift=now();
    save()
  }
  return db.rift
}
function boss(){
  if(db.boss&&now()<db.boss.ends)return db.boss;
  if(db.boss&&now()>=db.boss.ends)db.boss=null;

  const bosses=[
    {name:"THE RED ABYSS",hp:50000,maxHp:50000,defense:0.10,crit:0.08,counter:0.18},
    {name:"THE VOID EATER",hp:45000,maxHp:45000,defense:0.12,crit:0.10,counter:0.20},
    {name:"THE WATCHER",hp:40000,maxHp:40000,defense:0.18,crit:0.14,counter:0.16},
    {name:"THE RED GOD",hp:75000,maxHp:75000,defense:0.15,crit:0.16,counter:0.25}
  ];

  // A new world boss can spawn after the normal 7-day gate.
  if(!db.boss&&now()-(db.meta.lastBoss||0)>7*86400000&&Math.random()<.05){
    const index=(db.meta.bossIndex||0)%bosses.length;
    const b=bosses[index];
    db.boss={...b,ends:now()+86400000,attackers:{}};
    db.meta.bossIndex=(index+1)%bosses.length;
    db.meta.lastBoss=now();
    save();
  }
  return db.boss
}
function war(){
  if(db.war&&now()<db.war.ends)return db.war;
  if(db.war&&now()>=db.war.ends){
    db.war.winner=Object.entries(db.war.score).sort((a,b)=>b[1]-a[1])[0]?.[0]||"None";
    return db.war
  }
  if(!db.war&&now()-(db.meta.lastWar||0)>30*86400000&&Math.random()<.03){
    let f=Object.keys(factions),a=f[rnd(0,f.length-1)],b=f.filter(x=>x!==a)[rnd(0,f.length-2)];
    db.war={
      a,b,score:{
        [a]:0,[b]:0
      },ends:now()+7*86400000
    };
    db.meta.lastWar=now();
    save()
  }
  return db.war
}
const client=new Client({
  intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent],partials:[Partials.Channel]
});
client.once("ready",()=>{
  console.log(`🔴 RED VOID v4 ONLINE • ${client.user.tag}`);
  client.user.setActivity("/profile • Enter the Void");
  setInterval(()=>{
    event();
    rift();
    boss();
    war();
    save()
  },60000)
});
client.on("guildMemberAdd",async m=>{
  const role=process.env.MEMBER_ROLE_ID;
  if(role)await m.roles.add(role).catch(()=>{});
  const cid=process.env.WELCOME_CHANNEL_ID;
  if(!cid)return;
  const ch=m.guild.channels.cache.get(cid);
  if(!ch)return;
  const banner=serverBanner(m.guild);
  const e=imageEmbed(
    "🕳️ VITAJ V RED VOIDE",
    `## 🔴 Nový fragment vstúpil do Voidu\\n\\n`+
    `Vitaj, ${m}!\\n\\n`+
    `Nie každý, kto vstúpi do **Red Void**, nájde cestu späť.\\n`+
    `Tvoja cesta sa práve začína a Void bude sledovať každý tvoj krok.\\n\\n`+
    `### 🧩 ZAČNI SVOJU CESTU\\n\\n`+
    `🔮 **/profile** — tvoja identita a progres\\n`+
    `⭐ **/rank** — XP a level\\n`+
    `🔮 **/balance** — Void Points\\n`+
    `🌀 **/explore** — objavuj Void\\n`+
    `👁️ **/fate** — nechaj rozhodnúť Void\\n`+
    `🎲 **/roll** — otestuj svoj osud\\n\\n`+
    `━━━━━━━━━━━━━━━━━━━━\\n\\n`+
    `🌒 **Tvoja cesta sa práve začína.**\\n`+
    `🩸 Red Void čaká.`,
    "#E00000",
    banner,
    m.user.displayAvatarURL({extension:"png",size:256})
  );
  e.setFooter({text:"RED VOID • Beyond the Void"}).setTimestamp();
  ch.send({embeds:[e]}).catch(()=>{});
});
client.on("messageCreate",async m=>{
  if(m.author.bot||!m.guild)return;
  let u=U(m.author.id),t=now();
  u.messages++;
  event();
  if(t-u.lastXP>=Number(process.env.XP_COOLDOWN||60)*1000){
    u.lastXP=t;
    let x=rnd(Number(process.env.XP_MIN||15),Number(process.env.XP_MAX||30));
    let e=db.event;
    if(e?.type==="xp")x*=2;
    if((e?.type==="shadow"||e?.type==="blood")&&u.class==="Shadow")x=Math.floor(x*1.25);
    if(u.class==="Flameborn")x=Math.floor(x*1.1);
    u.xp+=x;
    u.alignment[Object.keys(u.alignment)[rnd(0,6)]]++;
    if(u.messages===1)award(m.author.id,"first");
    if(u.level>=5 && u.level%5===0){
      const levelRole=await getLevelRole(m.guild,u.level);
      if(levelRole && m.member && levelRole.position<m.guild.members.me.roles.highest.position && !m.member.roles.cache.has(levelRole.id)){
        await m.member.roles.add(levelRole,`Red Void Level ${u.level} sync`).catch(()=>{});
      }
    }
    while(u.xp>=need(u.level)){
      u.xp-=need(u.level);
      u.level++;
      u.vp+=25;
      if(u.level>=10)award(m.author.id,"lvl10");
      if(u.level%5===0){
        const levelRole=await getLevelRole(m.guild,u.level);
        if(levelRole && m.member && levelRole.position<m.guild.members.me.roles.highest.position){
          await m.member.roles.add(levelRole,`Reached Red Void Level ${u.level}`).catch(err=>console.error("LEVEL ROLE ADD:",err));
          const levelChannel=configuredChannel(m.guild,"LEVEL_CHANNEL_ID");
          (levelChannel||m.channel).send(`🏆 **${m.author.username} odomkol novú Red Void rolu!** → <@&${levelRole.id}>`).catch(()=>{});
        }
      }
      if(Math.random()<.1){
        u.relics.push(relic(u));
        award(m.author.id,"relic")
      }
      const levelChannel=configuredChannel(m.guild,"LEVEL_CHANNEL_ID");
      (levelChannel||m.channel).send(`⚡ **${m.author.username} dosiahol Level ${u.level}!** • +25 VP`).catch(()=>{})
    }
  }
  if(t-u.lastVP>=Number(process.env.VP_COOLDOWN||60)*1000){
    u.lastVP=t;
    u.vp+=Number(process.env.VP_MESSAGE||1)
  }
  save()
});

/*
 * 🔒 RED VOID CHANNEL SYSTEM
 * Commands are allowed only in their assigned channels.
 * Put the Discord channel IDs into your environment variables.
 */
const COMMAND_CHANNELS = {
    help: "BOT_COMMANDS_CHANNEL_ID",
    void: "PROFILE_CHANNEL_ID",
    contracts: "QUEST_CHANNEL_ID",
    duel: "DUEL_CHANNEL_ID",
    evolution: "PROFILE_CHANNEL_ID",
    corruption: "PROFILE_CHANNEL_ID",
    legacy: "PROFILE_CHANNEL_ID",
    season: "LEADERBOARD_CHANNEL_ID",
    event: "EVENT_CHANNEL_ID",
    roll: "ROLL_CHANNEL_ID",
    fate: "VOID_CHANNEL_ID",
    curse: "VOID_CHANNEL_ID",
    whisper: "VOID_CHANNEL_ID",
    ritual: "VOID_CHANNEL_ID",

    rift: "RIFT_CHANNEL_ID",
    "rift-join": "RIFT_CHANNEL_ID",

    boss: "BOSS_CHANNEL_ID",
    attack: "BOSS_CHANNEL_ID",

    shop: "SHOP_CHANNEL_ID",
    buy: "SHOP_CHANNEL_ID",

    bounties: "BOUNTY_CHANNEL_ID",
    bounty: "BOUNTY_CHANNEL_ID",
    quest: "QUEST_CHANNEL_ID",

    map: "MAP_CHANNEL_ID",
    explore: "MAP_CHANNEL_ID",

    war: "WAR_CHANNEL_ID",

    profile: "PROFILE_CHANNEL_ID",
    rank: "PROFILE_CHANNEL_ID",
    alignment: "PROFILE_CHANNEL_ID",
    relics: "PROFILE_CHANNEL_ID",
    achievements: "PROFILE_CHANNEL_ID",
    titles: "PROFILE_CHANNEL_ID",
    title: "PROFILE_CHANNEL_ID",
    classes: "PROFILE_CHANNEL_ID",
    class: "PROFILE_CHANNEL_ID",
    factions: "PROFILE_CHANNEL_ID",
    faction: "PROFILE_CHANNEL_ID",
    reputation: "PROFILE_CHANNEL_ID",
    collection: "PROFILE_CHANNEL_ID",
    streak: "PROFILE_CHANNEL_ID",
    cooldowns: "PROFILE_CHANNEL_ID",

    balance: "ECONOMY_CHANNEL_ID",
    daily: "ECONOMY_CHANNEL_ID",
    pay: "ECONOMY_CHANNEL_ID",

    // 🛡️ Moderation / setup commands stay in the bot/admin channel.
    leaderboard: "LEADERBOARD_CHANNEL_ID",
    clear: "BOT_COMMANDS_CHANNEL_ID",
    warn: "BOT_COMMANDS_CHANNEL_ID",
    warnings: "BOT_COMMANDS_CHANNEL_ID",
    "setup-level-roles": "BOT_COMMANDS_CHANNEL_ID",
    "setup-roles": "BOT_COMMANDS_CHANNEL_ID",
    timeout: "BOT_COMMANDS_CHANNEL_ID",
    "server-stats": "SERVER_STATS_CHANNEL_ID",
    "bot-control": "BOT_CONTROL_CHANNEL_ID",
    "command-log": "BOT_CONTROL_CHANNEL_ID",

    // 🩸 Daily Void Trials
    trial: "QUEST_CHANNEL_ID",
    "trial-claim": "QUEST_CHANNEL_ID",
};

function configuredChannel(guild,envName){
  const id=process.env[envName];
  return id ? guild.channels.cache.get(id) : null;
}


const COMMAND_COOLDOWN_MS=30_000;
const commandCooldowns=new Map();

function commandCooldownKey(i){
  return `${i.guildId||"dm"}:${i.user.id}:${i.commandName}`;
}
function cooldownRemaining(i){
  const last=commandCooldowns.get(commandCooldownKey(i))||0;
  return Math.max(0,COMMAND_COOLDOWN_MS-(now()-last));
}
function armCommandCooldown(i){
  commandCooldowns.set(commandCooldownKey(i),now());
  // Keep memory bounded.
  if(commandCooldowns.size>5000){
    const cutoff=now()-COMMAND_COOLDOWN_MS*2;
    for(const [k,t] of commandCooldowns)if(t<cutoff)commandCooldowns.delete(k);
  }
}
function recordCommandLog(i,status,extra={}){
  const entry={
    id:crypto.randomBytes(5).toString("hex"),
    at:now(),
    userId:i.user.id,
    userTag:i.user.tag||i.user.username,
    command:`/${i.commandName}`,
    channelId:i.channelId||"",
    channelName:i.channel?.name||"unknown",
    status,
    ...extra
  };
  db.commandLogs.unshift(entry);
  if(db.commandLogs.length>500)db.commandLogs.length=500;
  save();

  const logId=process.env.BOT_LOG_CHANNEL_ID;
  const logChannel=i.guild?.channels?.cache?.get(logId);
  if(logChannel?.isTextBased()){
    const color=status==="SUCCESS"?"#00A86B":status==="COOLDOWN"?"#F0A000":"#E00000";
    const e=new EmbedBuilder().setColor(color)
      .setTitle(status==="SUCCESS"?"🟢 COMMAND USED":status==="COOLDOWN"?"⏳ COMMAND COOLDOWN":"🚫 COMMAND BLOCKED")
      .setDescription(`**${entry.command}**`)
      .addFields(
        {name:"👤 User",value:`<@${entry.userId}>\\n\`${entry.userTag}\``,inline:true},
        {name:"📍 Channel",value:`<#${entry.channelId}>\\n\`#${entry.channelName}\``,inline:true},
        {name:"📊 Status",value:`\`${status}\``,inline:true}
      ).setFooter({text:"RED VOID • BOT LOG"}).setTimestamp(new Date(entry.at));
    logChannel.send({embeds:[e]}).catch(()=>{});
  }
  return entry;
}
function formatRecentLogs(limit=15){
  return db.commandLogs.slice(0,limit).map((x,n)=>
    `**${n+1}.** \`${x.command}\` • <@${x.userId}> • <#${x.channelId}> • ${x.status} • <t:${Math.floor(x.at/1000)}:R>`
  ).join("\n")||"Žiadne záznamy.";
}

function checkCommandChannel(i) {
    const envName = COMMAND_CHANNELS[i.commandName];

    // Every registered slash command is mapped. This also protects against
    // accidentally adding a new command without thinking about its channel.
    if (!envName) {
        console.warn(`⚠️ CHANNEL GUARD: /${i.commandName} nemá priradený kanál.`);
        return true;
    }

    const allowedChannelId = process.env[envName];

    if (!allowedChannelId) {
        i.reply({
            content:
                `⚠️ **Tento príkaz ešte nemá nastavený kanál.**\n\n` +
                `Admin musí nastaviť **${envName}** v `.env` / Bot-Hostingu.`,
            ephemeral: true
        }).catch(() => {});
        return false;
    }

    if (i.channelId === allowedChannelId) {
        return true;
    }

    const channel = i.guild?.channels?.cache?.get(allowedChannelId);
    const mention = channel ? `<#${allowedChannelId}>` : `\`${envName}\``;

    i.reply({
        content:
            `🚫 **Tento príkaz sem nepatrí.**\n\n` +
            `Použi **/${i.commandName}** v kanáli ${mention}.\n\n` +
            `🔴 Red Void chráni tento kanál pred spamom.`,
        ephemeral: true
    }).catch(() => {});

    return false;
}

async function run(i){
    if (!checkCommandChannel(i)) {
        recordCommandLog(i,"BLOCKED",{reason:"wrong_channel"});
        return;
    }

    const remaining=cooldownRemaining(i);
    if(remaining>0){
      const seconds=Math.ceil(remaining/1000);
      recordCommandLog(i,"COOLDOWN",{seconds});
      return i.reply({
        content:`⏳ **/${i.commandName}** má cooldown. Skús znova o **${seconds}s**.`,
        ephemeral:true
      }).catch(()=>{});
    }
    armCommandCooldown(i);
    recordCommandLog(i,"SUCCESS");

  const u=U(i.user.id),c=i.commandName;
  event();

  if(c==="server-stats"){
    if(!i.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return i.reply({content:"❌ Potrebuješ Manage Server.",ephemeral:true});
    const g=i.guild;
    const text=`👥 Členovia: **${g.memberCount}**\n`+
      `💬 Textové kanály: **${g.channels.cache.filter(x=>x.isTextBased()).size}**\n`+
      `🔊 Voice kanály: **${g.channels.cache.filter(x=>x.isVoiceBased()).size}**\n`+
      `🎭 Role: **${g.roles.cache.size}**\n`+
      `😀 Emotes: **${g.emojis.cache.size}**\n`+
      `🤖 Bot: **${client.user.tag}**\n`+
      `📡 Ping: **${client.ws.ping}ms**\n`+
      `⏱️ Uptime: **${Math.floor(process.uptime()/3600)}h ${Math.floor(process.uptime()%3600/60)}m**\n`+
      `📜 Logov v pamäti: **${db.commandLogs.length}**`;
    return i.reply({embeds:[imageEmbed("📊 RED VOID • SERVER STATS",text,"#E00000",serverBanner(i.guild))]});
  }

  if(c==="bot-control"){
    if(!i.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return i.reply({content:"❌ Potrebuješ Manage Server.",ephemeral:true});
    const logs=formatRecentLogs(20);
    const e=new EmbedBuilder().setColor("#E00000").setTitle("🛡️ RED VOID • BOT CONTROL")
      .setDescription(`**Live status:** 🟢 ONLINE\n**Ping:** ${client.ws.ping}ms\n**Uptime:** ${Math.floor(process.uptime()/60)} min\n**Command cooldown:** 30s\n\n### 📜 Posledné príkazy\n${logs}`)
      .setFooter({text:"RED VOID • BOT CONTROL"}).setTimestamp();
    return i.reply({embeds:[e],ephemeral:true});
  }

  if(c==="command-log"){
    if(!i.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return i.reply({content:"❌ Potrebuješ Manage Server.",ephemeral:true});
    return i.reply({embeds:[new EmbedBuilder().setColor("#E00000").setTitle("📜 RED VOID • COMMAND LOG").setDescription(formatRecentLogs(30)).setFooter({text:"RED VOID • BOT LOG"}).setTimestamp()],ephemeral:true});
  }

    if(c==="help"){
    return i.reply({embeds:[imageEmbed("🔴 RED VOID COMMAND CENTER",
      `### 👤 PROFILE\\n/profile • /rank • /alignment • /relics • /achievements • /titles • /classes • /factions • /reputation • /collection • /streak • /cooldowns\\n\\n`+
      `### 🔮 ECONOMY\\n/balance • /daily • /pay • /shop • /buy\\n\\n`+
      `### 🌀 ACTIVITIES\\n/roll • /fate • /curse • /whisper • /ritual • /explore • /map • /quest\\n\\n`+
      `### ⚔️ COMBAT\\n/rift • /rift-join • /boss • /attack • /duel • /bounty • /bounties\\n\\n`+
      `### 🌑 WORLD\\n/event • /war • /contracts • /evolution • /corruption • /legacy • /season`,
      "#E00000",commandImage("HELP_IMAGE_URL",serverBanner(i.guild)))]});
  }

  if(c==="void"){
    const stage=u.level>=100?"👑 CHILD OF THE VOID":u.level>=50?"👁️ ASCENDED":u.level>=25?"🌀 VOIDBORN":u.level>=10?"🌒 VOID TOUCHED":"🧩 FRAGMENT";
    return i.reply({embeds:[imageEmbed("🕳️ YOUR VOID",
      `Stage: **${stage}**\\n⭐ Level: **${u.level}**\\n🔮 VP: **${u.vp}**\\n🩸 Corruption: **${u.corruption||0}%**\\n🔴 Legacy: **${u.legacy||0}**`,
      "#7B2FFF",commandImage("VOID_IMAGE_URL",serverBanner(i.guild)),i.user.displayAvatarURL({extension:"png",size:256}))]});
  }

  if(c==="trial"){
    const todayKey=today();
    if(u.trialDate!==todayKey){
      u.trialDate=todayKey;
      u.trialStart={messages:u.messages,rolls:u.rolls,explores:u.explores};
      u.trialClaimed="";
      save();
    }
    const trials=[
      {id:"messages",icon:"💬",name:"ECHO TRIAL",goal:25,progress:Math.max(0,u.messages-u.trialStart.messages),text:"Napíš 25 správ",rewardXP:400,rewardVP:350},
      {id:"rolls",icon:"🎲",name:"FATE TRIAL",goal:5,progress:Math.max(0,u.rolls-u.trialStart.rolls),text:"Použi /roll 5×",rewardXP:500,rewardVP:450},
      {id:"explore",icon:"🗺️",name:"GATE TRIAL",goal:3,progress:Math.max(0,u.explores-u.trialStart.explores),text:"Preskúmaj Void 3×",rewardXP:600,rewardVP:500}
    ];
    const idx=(new Date(todayKey).getUTCDate()+new Date(todayKey).getUTCMonth())%trials.length;
    const t=trials[idx], progress=Math.min(t.goal,t.progress);
    const trialImg=staticAssetAttachment("void_trials.png","void_trials.png");
    return i.reply({embeds:[imageEmbed(
      `${t.icon} ${t.name}`,
      `### ${t.text}\n\nProgress: **${progress}/${t.goal}**\n\n🎁 Reward: **+${t.rewardXP} XP • +${t.rewardVP} VP**\n\nPouži **/trial-claim** po dokončení.`,
      "#E00000",trialImg?"attachment://void_trials.png":commandImage("TRIAL_IMAGE_URL",serverBanner(i.guild))
    )],files:trialImg?[trialImg]:[]});
  }

  if(c==="trial-claim"){
    const todayKey=today();
    if(u.trialDate!==todayKey){
      u.trialDate=todayKey;u.trialStart={messages:u.messages,rolls:u.rolls,explores:u.explores};u.trialClaimed="";save();
    }
    if(u.trialClaimed===todayKey)return i.reply({content:"🕳️ Dnešný Void Trial už bol vyzdvihnutý.",ephemeral:true});
    const trials=[
      {goal:25,progress:Math.max(0,u.messages-u.trialStart.messages),rewardXP:400,rewardVP:350},
      {goal:5,progress:Math.max(0,u.rolls-u.trialStart.rolls),rewardXP:500,rewardVP:450},
      {goal:3,progress:Math.max(0,u.explores-u.trialStart.explores),rewardXP:600,rewardVP:500}
    ];
    const idx=(new Date(todayKey).getUTCDate()+new Date(todayKey).getUTCMonth())%trials.length;
    const t=trials[idx];
    if(t.progress<t.goal)return i.reply({content:`❌ Trial ešte nie je hotový. Progress: **${Math.min(t.progress,t.goal)}/${t.goal}**.`,ephemeral:true});
    u.trialClaimed=todayKey;u.xp+=t.rewardXP;u.vp+=t.rewardVP;save();
    award(i.user.id,"contract");
    return i.reply(`🏆 **VOID TRIAL COMPLETE** • +${t.rewardXP} XP • +${t.rewardVP} VP`);
  }

  if(c==="contracts"){
    const q=[["💬 Echo of the Void","Napíš 25 správ"],["🎲 Dice of Fate","Použi /roll 5×"],["🗺️ Beyond the Gate","Preskúmaj Void 3×"],["🌀 Rift Hunter","Vstúp do Riftu"],["💎 Relic Seeker","Získaj 1 Relic"]];
    const chosen=[q[rnd(0,q.length-1)],q[rnd(0,q.length-1)],q[rnd(0,q.length-1)]];
    return i.reply({embeds:[imageEmbed("🩸 VOID CONTRACTS",
      chosen.map((x,n)=>`**${n+1}. ${x[0]}**\\n> ${x[1]}\\n🎁 **+250 XP • +300 VP**`).join("\\n\\n"),
      "#C1121F",commandImage("CONTRACT_IMAGE_URL",serverBanner(i.guild)))]});
  }

  if(c==="evolution"){
    const stage=u.level>=100?"👑 CHILD OF THE VOID":u.level>=50?"👁️ ASCENDED":u.level>=25?"🌀 VOIDBORN":u.level>=10?"🌒 VOID TOUCHED":"🧩 FRAGMENT";
    const next=u.level<10?"Level 10":u.level<25?"Level 25":u.level<50?"Level 50":u.level<100?"Level 100":"MAX";
    return i.reply({embeds:[imageEmbed("🧬 VOID EVOLUTION",
      `Current form: **${stage}**\\n⭐ Level: **${u.level}**\\n🔮 Next evolution: **${next}**`,
      "#8A2BE2",commandImage("EVOLUTION_IMAGE_URL",serverBanner(i.guild)))]});
  }

  if(c==="corruption"){
    const value=Math.min(100,Math.max(0,u.corruption||0));
    const bar="█".repeat(Math.floor(value/10))+"░".repeat(10-Math.floor(value/10));
    const state=value>=100?"☠️ CORRUPTED":value>=75?"🩸 UNSTABLE":value>=40?"👁️ TOUCHED":"🕳️ UNKNOWN";
    return i.reply({embeds:[imageEmbed("🩸 VOID CORRUPTION",
      `${bar} **${value}%**\\n\\nStatus: **${state}**\\n\\nCertain Void activities increase Corruption.`,
      "#8B0000",commandImage("CORRUPTION_IMAGE_URL",serverBanner(i.guild)))]});
  }

  if(c==="legacy"){
    return i.reply({embeds:[imageEmbed("🔴 VOID LEGACY",
      `Legacy: **${u.legacy||0}**\\n\\nReach **Level 100** and complete major milestones to awaken your Legacy.`,
      "#E00000",commandImage("LEGACY_IMAGE_URL",serverBanner(i.guild)))]});
  }

  if(c==="season"){
    const top=Object.entries(db.users).sort((a,b)=>(b[1].seasonXP||0)-(a[1].seasonXP||0)).slice(0,10);
    return i.reply({embeds:[imageEmbed("🏆 SEASON I • THE AWAKENING",
      top.map((x,n)=>`${n+1}. <@${x[0]}> — **${x[1].seasonXP||0} Season XP**`).join("\\n")||"Void is empty.",
      "#FFD700",commandImage("SEASON_IMAGE_URL",serverBanner(i.guild)))]});
  }

  if(c==="duel"){
    const opponent=i.options.getUser("user");
    if(!opponent||opponent.bot||opponent.id===i.user.id)return i.reply({content:"❌ Neplatný súper.",ephemeral:true});
    const ou=U(opponent.id);
    const my=rnd(1,100)+u.level*10+u.relics.length*5;
    const their=rnd(1,100)+ou.level*10+ou.relics.length*5;
    const win=my>=their;
    u.duels=(u.duels||0)+1; ou.duels=(ou.duels||0)+1;
    if(win){u.duelWins=(u.duelWins||0)+1;u.vp+=250;u.seasonXP=(u.seasonXP||0)+100;}
    else {ou.duelWins=(ou.duelWins||0)+1;ou.vp+=250;ou.seasonXP=(ou.seasonXP||0)+100;}
    save();
    return i.reply({embeds:[imageEmbed("⚔️ VOID DUEL",
      `**${i.user.username}** ${win?"👑 VICTORY":"💀 DEFEAT"} **${opponent.username}**\\n\\n${i.user.username}: **${my}**\\n${opponent.username}: **${their}**\\n\\n🏆 Winner receives **250 VP + 100 Season XP**.`,
      win?"#E00000":"#5B0A0A",commandImage("DUEL_IMAGE_URL",serverBanner(i.guild)))]});
  }

  rift();
  boss();
  war();
  if(c==="profile"||c==="rank")return i.reply({
    embeds:[emb("🔴 RED VOID PROFILE",`👤 **${i.user.username}**\n🏷️ ${u.activeTitle||"No Title"}\n🧬 Alignment: **${align(u)}**\n⚔️ Class: **${u.class||"Unchosen"}**\n🏛️ Faction: **${u.faction||"Unchosen"}**\n⭐ Level: **${u.level}** • XP **${u.xp}/${need(u.level)}**\n🔮 VP: **${u.vp}**\n🩸 Void Power: **${Math.min(100,Math.floor(u.level*1.5+u.relics.length*2))}%**\n🔥 Daily streak: **${u.streak}**\n💎 Relics: **${u.relics.length}**\n🏆 Achievements: **${u.achievements.length}**\n🗺️ Explores: **${u.explores}**\n⚔️ Boss damage: **${u.bossDamage}`)]
  });
  if(c==="leaderboard"){
    let a=Object.entries(db.users).sort((a,b)=>totalXP(b[1])-totalXP(a[1])).slice(0,10);
    return i.reply({
      embeds:[emb("🏆 RED VOID LEADERBOARD",a.map((x,n)=>`${n+1}. <@${x[0]}> — Lv.${x[1].level} • ${totalXP(x[1])} XP • ${x[1].vp} VP`).join("\n")||"Void je prázdny.")]
    })
  }
  if(c==="balance")return i.reply({
    embeds:[emb("🔮 VOID WALLET",`**${u.vp} VP**`,"#7B2FFF")]
  });
  if(c==="daily"){
    if(u.lastDaily===today())return i.reply({
      content:"🕳️ Daily už máš.",ephemeral:true
    });
    let diff=u.lastDaily?Math.floor((new Date(today())-new Date(u.lastDaily))/86400000):0;
    u.streak=diff===1?u.streak+1:1;
    u.lastDaily=today();
    let x=Number(process.env.VP_DAILY||100)+Math.min(200,u.streak*5);
    u.vp+=x;
    if(u.streak>=7)award(i.user.id,"daily7");
    save();
    return i.reply({
      embeds:[emb("🎁 DAILY VOID",`+**${x} VP**\n🔥 Streak: **${u.streak} dní**`,"#FF5E00")]
    })
  }
  if(c==="pay"){
    let to=i.options.getUser("user"),a=i.options.getInteger("amount");
    if(to.bot||to.id===i.user.id||u.vp<a)return i.reply({
      content:"❌ Neplatný transfer.",ephemeral:true
    });
    u.vp-=a;
    U(to.id).vp+=a;
    save();
    return i.reply(`🔮 <@${to.id}> dostal **${a} VP**.`)
  }
  if(c==="alignment")return i.reply({
    embeds:[emb("🧬 VOID ALIGNMENT",`Dominant: **${align(u)}**\n\n`+Object.entries(u.alignment).map(x=>`${x[0]} — ${x[1]}`).join("\n"),"#9B30FF")]
  });
  if(c==="relics")return i.reply({
    embeds:[emb("💎 VOID RELICS",u.relics.map(x=>`💎 ${x}`).join("\n")||"Žiadne.","#D100FF")]
  });
  if(c==="achievements")return i.reply({
    embeds:[emb("🏆 ACHIEVEMENTS",Object.values(achievements).map(x=>`🏆 ${x}`).join("\n")+`\n\nOdomknuté: **${u.achievements.length}**`,"#FFD700")]
  });
  if(c==="titles")return i.reply({
    embeds:[emb("🏷️ VOID TITLES",`Získané: ${u.titles.join(", ")||"Žiadne"}\nAktívny: **${u.activeTitle||"None"}**`,"#FFD700")]
  });
  if(c==="title"){
    let n=i.options.getString("name").toUpperCase();
    if(!u.titles.includes(n))return i.reply({
      content:"❌ Tento titul ešte nemáš.",ephemeral:true
    });
    u.activeTitle=n;
    save();
    return i.reply(`🏷️ Aktívny titul: **${n}**`)
  }
  if(c==="classes")return i.reply({
    embeds:[emb("⚔️ VOID CLASSES",Object.entries(classes).map(([k,v])=>`${v.e} **${k}** — ${v.d}`).join("\n"),"#E00000")]
  });
  if(c==="class"){
    let n=i.options.getString("name"),k=Object.keys(classes).find(x=>x.toLowerCase()===n.toLowerCase());
    if(!k)return i.reply({
      content:"❌ Neznáma class. Použi /classes.",ephemeral:true
    });
    u.class=k;
    award(i.user.id,"class");
    save();
    return i.reply(`⚔️ **${k}** — ${classes[k].d}`)
  }
  if(c==="factions")return i.reply({
    embeds:[emb("🏛️ VOID FACTIONS",Object.entries(factions).map(([k,v])=>`${v.e} **${k}** — ${v.d}`).join("\n"),"#8B0000")]
  });
  if(c==="faction"){
    let n=i.options.getString("name"),k=Object.keys(factions).find(x=>x.toLowerCase()===n.toLowerCase());
    if(!k)return i.reply({
      content:"❌ Neznáma faction. Použi /factions.",ephemeral:true
    });
    u.faction=k;
    u.rep[k]=(u.rep[k]||0)+10;
    award(i.user.id,"faction");
    save();
    return i.reply(`🏛️ **${k}** — +10 reputation`)
  }
  if(c==="reputation")return i.reply({
    embeds:[emb("🏛️ REPUTATION",Object.entries(u.rep).map(x=>`${x[0]} — **${x[1]} rep**`).join("\n")||"Žiadna.") ]
  });
  if(c==="bounties"){
    let a=[["1","💬 Ozvena","Napíš 20 správ",150,100],["2","🌀 Riftborn","Vstúp do Riftu",200,150],["3","💎 Relic Hunter","Získaj relic",300,250],["4","🔥 Daily Survivor","Vyzdvihni daily",120,100]];
    return i.reply({
      embeds:[emb("🩸 TODAY'S BOUNTIES",a.map(x=>`**${x[0]}. ${x[1]}** — ${x[2]}\n+${x[3]} XP • +${x[4]} VP`).join("\n\n"),"#C1121F")]
    })
  }
  if(c==="bounty"){
    let id=i.options.getString("id"),r={
      1:[150,100],2:[200,150],3:[300,250],4:[120,100]
    }
    [id],k=today()+"-"+id;
    if(!r)return i.reply({
      content:"❌ Neznáma bounty.",ephemeral:true
    });
    if(u.bounties[k])return i.reply({
      content:"✅ Už splnené.",ephemeral:true
    });
    u.bounties[k]=true;
    u.xp+=r[0];
    u.vp+=r[1];
    save();
    return i.reply(`🏆 **BOUNTY COMPLETE** • +${r[0]} XP • +${r[1]} VP`)
  }
  if(c==="rift"){
    let r=db.rift;
    if(!r)return i.reply("🕳️ Žiadny Rift nie je aktívny.");
    return i.reply({
      embeds:[emb("🌀 VOID RIFT",`#${r.id}\nIntegrity: **${r.hp}/100**\nParticipants: **${r.participants.length}**\n⏳ ${Math.max(0,Math.floor((r.ends-now())/60000))} min\nPouži /rift-join.`,"#00BFFF")]
    })
  }
  if(c==="rift-join"){
    let r=db.rift;
    if(!r)return i.reply({
      content:"🕳️ Rift nie je aktívny.",ephemeral:true
    });
    if(r.participants.includes(i.user.id))return i.reply({
      content:"🌀 Už si v Rifte.",ephemeral:true
    });
    r.participants.push(i.user.id);
    u.rifts++;
    u.vp+=50;
    award(i.user.id,"rift");
    if(u.faction&&db.war&&[db.war.a,db.war.b].includes(u.faction))db.war.score[u.faction]+=5;
    save();
    return i.reply("🌀 **Riftwalker** • +50 VP")
  }
  
const BOSS_ABILITIES={
  "THE RED ABYSS":[
    "🩸 Blood Pulse — 20% šanca, že po útoku vyšle spätný Void damage.",
    "🔥 Crimson Rage — pod 30% HP získava enraged stav.",
    "☠️ Abyss Mark — náhodný hráč môže dostať dočasnú kliatbu."
  ],
  "THE VOID EATER":[
    "🕳️ Devour — 15% šanca, že zníži odmenu z útoku.",
    "🌌 Void Drain — pri nízkom HP obnoví malé množstvo HP.",
    "👁️ Hunger — čím nižšie HP, tým vyšší protiútok."
  ],
  "THE WATCHER":[
    "👁️ Eye of Judgment — 20% šanca na kritický protiútok.",
    "🌀 Time Fracture — môže predĺžiť cooldown útočníka.",
    "🔮 Omniscience — pri 25% HP zvyšuje obranu."
  ],
  "THE RED GOD":[
    "🔥 Godfire — vysoká šanca na silný protiútok.",
    "🩸 Blood Offering — pod 40% HP mení časť damage na regeneráciu.",
    "☠️ Apocalypse — pri 10% HP sa aktivuje posledný enraged útok."
  ]
};
function bossAbilities(name){
  return BOSS_ABILITIES[name]||BOSS_ABILITIES["THE RED ABYSS"];
}
function bossHpGifName(name,hp,maxHp){
  const pct=maxHp?Math.round(Math.max(0,Math.min(1,hp/maxHp))*100):0;
  const level=Math.max(0,Math.min(100,Math.round(pct/10)*10));
  return `boss_${bossAssetKey(name)}_hp_${level}.gif`;
}
function bossButtons(){
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("boss_attack").setLabel("ATTACK").setEmoji("⚔️").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("boss_defend").setLabel("DEFEND").setEmoji("🛡️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("boss_abilities").setLabel("ABILITIES").setEmoji("☠️").setStyle(ButtonStyle.Secondary)
  );
}

function bossPhase(b){
  const p=bossHpPercent(b.hp,b.maxHp);
  if(p<=10)return {name:"APOCALYPSE",mult:1.35};
  if(p<=25)return {name:"ENRAGED",mult:1.20};
  if(p<=50)return {name:"FRENZY",mult:1.10};
  if(p<=75)return {name:"WOUNDED",mult:1.00};
  return {name:"NORMAL",mult:1.00};
}
function ensureBossCombat(b){
  if(!b.combat)b.combat={totalDamage:0,round:0,top:{},lastAttack:0};
  if(!b.attackers)b.attackers={};
  return b.combat;
}
function recordBossDamage(b,userId,dmg){
  const c=ensureBossCombat(b);
  c.totalDamage=(c.totalDamage||0)+dmg;
  c.round=(c.round||0)+1;
  c.top[userId]=(c.top[userId]||0)+dmg;
  b.attackers[userId]=(b.attackers[userId]||0)+dmg;
}
function combatButtonRow(){
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("boss_attack").setLabel("ATTACK").setEmoji("⚔️").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("boss_defend").setLabel("DEFEND").setEmoji("🛡️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("boss_abilities").setLabel("ABILITIES").setEmoji("☠️").setStyle(ButtonStyle.Secondary)
  );
}
async function executeBossDefend(i){
  const b=db.boss;
  if(!b)return i.reply({content:"👹 Boss nie je aktívny.",ephemeral:true});
  const key=commandCooldownKey({...i,commandName:"defend"});
  const last=commandCooldowns.get(key)||0;
  const remaining=Math.max(0,COMMAND_COOLDOWN_MS-(now()-last));
  if(remaining>0)return i.reply({content:`⏳ **DEFEND** je na cooldown-e. Skús znova o **${Math.ceil(remaining/1000)}s**.`,ephemeral:true});
  commandCooldowns.set(key,now());
  const u=U(i.user.id);
  u.vp+=5;
  const combat=ensureBossCombat(b);
  combat.defenders=combat.defenders||{};
  combat.defenders[i.user.id]=now()+45000;
  save();
  return i.reply({embeds:[emb("🛡️ VOID GUARD",
    `**${i.user.username}** sa pripravuje na protiútok.\\n\\n🛡️ Nasledujúcich **45 sekúnd** máš znížený Boss counter damage.\\n💰 **+5 VP** za obrannú akciu.`,
    "#7A8CFF")],components:[combatButtonRow()]});
}
async function executeBossAttack(i){
  const b=db.boss;
  if(!b)return i.reply({content:"👹 Boss nie je aktívny.",ephemeral:true});
  const key=commandCooldownKey({...i,commandName:"attack"});
  const last=commandCooldowns.get(key)||0;
  const remaining=Math.max(0,COMMAND_COOLDOWN_MS-(now()-last));
  if(remaining>0)return i.reply({content:`⏳ **ATTACK** je na cooldown-e. Skús znova o **${Math.ceil(remaining/1000)}s**.`,ephemeral:true});
  commandCooldowns.set(key,now());

  const u=U(i.user.id);
  const phase=bossPhase(b);
  let d=rnd(100,500);
  if(u.class==="Warden")d=Math.floor(d*1.10);
  if(u.class==="Assassin")d=Math.floor(d*1.15);
  if(u.class==="Mage")d=Math.floor(d*1.08);
  const critical=Math.random()<b.crit;
  if(critical)d=Math.floor(d*1.75);
  const blocked=Math.random()<b.defense;
  if(blocked)d=Math.max(40,Math.floor(d*0.75));
  d=Math.max(1,Math.floor(d*phase.mult));

  b.hp=Math.max(0,b.hp-d);
  u.bossDamage=(u.bossDamage||0)+d;
  u.vp=(u.vp||0)+Math.floor(d/10);
  recordBossDamage(b,i.user.id,d);
  award(i.user.id,"boss");

  let counter="";
  const combat=ensureBossCombat(b);
  const defended=(combat.defenders?.[i.user.id]||0)>now();
  if(Math.random()<(b.counter||0) && b.hp>0){
    let counterDamage=rnd(10,40);
    if(defended)counterDamage=Math.floor(counterDamage*0.35);
    if(phase.name==="APOCALYPSE")counterDamage=Math.floor(counterDamage*1.5);
    u.vp=Math.max(0,(u.vp||0)-Math.min(u.vp,counterDamage));
    counter=`\n\n💀 **Boss Counter:** -${counterDamage} VP${defended?" • 🛡️ DEFEND reduced the effect":""}`;
  }

  if(b.hp===0){
    u.vp+=1000;
    u.relics=u.relics||[];
    u.relics.push(relic(u));
    const ranking=Object.entries(b.attackers||{}).sort((a,z)=>z[1]-a[1]).slice(0,3);
    db.boss=null;
    save();
    const podium=ranking.map((x,n)=>`${["🥇","🥈","🥉"][n]} <@${x[0]}> — **${x[1].toLocaleString()} DMG**`).join("\n")||"Žiadne údaje";
    return i.reply({embeds:[emb("💀 BOSS DEFEATED",
      `**${b.name}** padol!\\n\\n⚔️ Tvoj posledný zásah: **${d.toLocaleString()} DMG**\\n💰 **+1000 VP**\\n💎 **Legendary Relic získaný!**\\n\\n### 🏆 TOP DAMAGE\\n${podium}`,
      "#E00000")],components:[]});
  }

  save();
  const hpName=bossHpGifName(b.name,b.hp,b.maxHp);
  const hpGif=staticAssetAttachment(hpName,hpName);
  const e=emb("⚔️ VOID STRIKE",
    `${critical?"💥 **CRITICAL HIT!**\\n":""}${blocked?"🛡️ **Boss absorbed part of the damage.**\\n":""}`+
    `**-${d.toLocaleString()} HP**\\n\\n`+
    `❤️ **${b.hp.toLocaleString()} / ${b.maxHp.toLocaleString()} HP** • **${bossHpPercent(b.hp,b.maxHp)}%**\\n`+
    `🔥 **Phase: ${phase.name}** • x${phase.mult.toFixed(2)} damage${counter}`,
    "#E00000");
  if(hpGif)e.setImage(`attachment://${hpName}`);
  return i.reply({embeds:[e],files:hpGif?[hpGif]:[],components:[combatButtonRow()]});
}


if(c==="boss"){
    const b=db.boss;
    if(!b)return i.reply("👹 Žiadny Boss nie je aktívny.");
    const key=bossAssetKey(b.name);
    const artName=`boss_${key}.png`;
    const hpName=bossHpGifName(b.name,b.hp,b.maxHp);
    const art=staticAssetAttachment(artName,artName);
    const hpGif=staticAssetAttachment(hpName,hpName);
    const pct=bossHpPercent(b.hp,b.maxHp);
    const abilities=bossAbilities(b.name);

    const bossEmbed=emb(`☠️ ${b.name||"THE RED ABYSS"}`,
      `❤️ **${b.hp.toLocaleString()} / ${b.maxHp.toLocaleString()} HP** • **${pct}%**\\n`+
      `⏳ **${Math.max(0,Math.floor((b.ends-now())/3600000))}h remaining**\n`+
      `🔥 **Combat Phase: ${bossPhase(b).name}** • x${bossPhase(b).mult.toFixed(2)} damage\n`+
      `⚔️ **Total Raid Damage:** ${(b.combat?.totalDamage||0).toLocaleString()}\n\n`+
      `### ☠️ BOSS ABILITIES\\n${abilities.map(x=>`> ${x}`).join("\\n")}\\n\\n`+
      `⚔️ Stlač **ATTACK** a zaútoč na Boss-a.\\n`+
      `☠️ Stlač **ABILITIES** pre zobrazenie schopností.`,
      "#E00000");
    bossEmbed.setFooter({text:"RED VOID • BOSS FIGHT"});
    if(art)bossEmbed.setImage(`attachment://${artName}`);

    const hpEmbed=emb(`❤️ ${b.name||"BOSS"} • HP`,
      `Aktuálne HP: **${b.hp.toLocaleString()} / ${b.maxHp.toLocaleString()}** • **${pct}%**`,
      "#E00000");
    hpEmbed.setFooter({text:"RED VOID • LIVE HP"});
    if(hpGif)hpEmbed.setImage(`attachment://${hpName}`);

    return i.reply({
      embeds:[bossEmbed,hpEmbed],
      files:[...(art?[art]:[]),...(hpGif?[hpGif]:[])],
      components:[bossButtons()]
    });
  }
  if(c==="attack"){
    return executeBossAttack(i);
  }
    if(c==="shop"){
    const img=staticAssetAttachment("void_market.png","void_market.png");
    const e=imageEmbed(
      "🛒 VOID MARKET",
      "### 💰 Zakázané predmety z hlbín Voidu\n\n"+
      "⚡ `voidboost` — **250 VP** — +100 XP\n"+
      "💎 `relicbox` — **500 VP** — Random Relic\n"+
      "👑 `voidtitle` — **1,500 VP** — Random Title\n"+
      "🔱 `factionseal` — **750 VP** — +50 Reputation\n"+
      "🩸 `bloodelixir` — **900 VP** — +500 XP\n"+
      "🕳️ `riftkey` — **1,200 VP** — Rift access\n\n"+
      "Použi **/buy** a do položky zadaj ID predmetu.",
      "#E00000",
      img?"attachment://void_market.png":commandImage("SHOP_IMAGE_URL",serverBanner(i.guild))
    );
    e.setFooter({text:"RED VOID • VOID MARKET"});
    return i.reply({embeds:[e],files:img?[img]:[]});
  }
  if(c==="buy"){
    let id=i.options.getString("item"),cost={
      voidboost:250,relicbox:500,voidtitle:1500,factionseal:750,bloodelixir:900,riftkey:1200
    }
    [id];
    if(!cost)return i.reply({
      content:"❌ Neznámy item.",ephemeral:true
    });
    if(u.vp<cost)return i.reply({
      content:"❌ Nedostatok VP.",ephemeral:true
    });
    u.vp-=cost;
    if(id==="voidboost")u.xp+=100;
    if(id==="bloodelixir")u.xp+=500;
    if(id==="riftkey"){
      u.vp+=0;
      award(i.user.id,"rift");
    }
    if(id==="relicbox"){
      u.relics.push(relic(u));
      award(i.user.id,"relic")
    }
    if(id==="voidtitle"){
      let x=titles[rnd(0,titles.length-1)];
      if(!u.titles.includes(x))u.titles.push(x)
    }
    if(id==="factionseal"&&u.faction)u.rep[u.faction]=(u.rep[u.faction]||0)+50;
    save();
    return i.reply(`🛒 Zakúpené: **${id}**`)
  }
  if(c==="event"){
    let e=db.event;
    if(!e)return i.reply("🕯️ Žiadny event nie je aktívny.");
    if(e.type==="blood")award(i.user.id,"whisper");
    return i.reply({
      embeds:[imageEmbed(`${e.emoji} ${e.name}`,`⏳ ${Math.max(0,Math.floor((e.ends-now())/60000))} min\nBonus je aktívny.`,"#E00000",commandImage("EVENT_IMAGE_URL",serverBanner(i.guild)))]
    })
  }
  if(c==="roll"){
    let n=rnd(1,100),d=n>=90?500:n>=70?200:n<=10?-50:n;
    u.vp=Math.max(0,u.vp+d);
    u.rolls++;
    award(i.user.id,"roll");
    save();
    return i.reply({
      embeds:[emb("🎲 VOID DICE",`Hodil si **${n}**\n\n${n>=90?"👑 THE CHOSEN":n>=70?"💎 RARE FATE":n<=10?"💀 VOID REJECTED":"🕳️ The Void Watches"}\n\n${d>=0?"+":""}${d} VP`,"#D100FF")]
    })
  }
  if(c==="curse"){
    if(!u.curse||u.curse.ends<=now())return i.reply("🕯️ Nemáš aktívnu Void Curse.");
    return i.reply(`🩸 **${u.curse.name}** • ${Math.ceil((u.curse.ends-now())/60000)} min`)
  }
  if(c==="fate"){
    let a=[["🩸 BLOOD OATH",500],["👁️ THE VISION",300],["🌒 SHADOW MARK",250],["🌀 RIFTBORN",400],["💀 VOID REJECTED",-100],["👑 THE CHOSEN",1000]][rnd(0,5)];
    u.vp=Math.max(0,u.vp+a[1]);
    u.fateUses++;
    if(a[0].includes("SHADOW")&&!u.titles.includes("SHADOWBORN"))u.titles.push("SHADOWBORN");
    award(i.user.id,"fate");
    save();
    return i.reply(`👁️ **THE VOID HAS CHOSEN**\n${a[0]}\n${a[1]>=0?"+":""}${a[1]} VP`)
  }
  if(c==="map")return i.reply({
    embeds:[emb("🗺️ THE VOID MAP","👁️ THE EYE\n　│\n🌒 SHADOW FOREST ─ 🔮 SEER'S SANCTUM\n　│\n🩸 BLOOD CITADEL ─ 🕳️ RED VOID ─ 🔥 FLAME WASTES\n　│\n🌀 RIFT ZONE ─ ⏳ TIME RUINS","#7B2FFF")]
  });
  if(c==="explore"){
    let p=["Shadow Forest","Blood Citadel","Flame Wastes","Rift Zone","Time Ruins","Seer's Sanctum"][rnd(0,5)];
    u.explores++;
    u.vp+=rnd(50,150);
    if(Math.random()<.35)u.relics.push(relic(u));
    award(i.user.id,"explore");
    if(u.faction&&db.war&&[db.war.a,db.war.b].includes(u.faction))db.war.score[u.faction]+=2;
    save();
    return i.reply(`🗺️ **${p}** explored • +50–150 VP`)
  }
  if(c==="quest"){
    let q=["Napíš 20 správ.","Získaj relic.","Vstúp do Riftu.","Hoď Void Dice.","Preskúmaj Void.","Vyzdvihni Daily."];
    return i.reply(`🕯️ **RANDOM VOID QUEST**\n${q[rnd(0,5)]}`)
  }
  if(c==="war"){
    let w=db.war;
    if(!w)return i.reply("⚔️ Faction War momentálne neprebieha.");
    return i.reply(`⚔️ **THE VOID WAR**\n${w.a}: ${w.score[w.a]}\n${w.b}: ${w.score[w.b]}\n⏳ ${Math.max(0,Math.floor((w.ends-now())/86400000))} dní`)
  }
  if(c==="whisper"){
    const a=["The Void remembers your name.","Something is watching from the Rift.","Do not trust the next shadow.","The red moon has seen you.","Your path was chosen before you arrived."];
    u.whispers++;
    award(i.user.id,"whisper");
    save();
    return i.reply({
      embeds:[emb("👁️ VOID WHISPER",a[rnd(0,a.length-1)],"#9B30FF")]
    });
  }
  if(c==="ritual"){
    if(db.ritual===today())return i.reply({
      content:"🕯️ Dnešný Ritual už bol vykonaný.",ephemeral:true
    });
    db.ritual=today();
    u.rituals++;
    u.vp+=150;
    award(i.user.id,"ritual");
    save();
    return i.reply("🕯️ **VOID RITUAL COMPLETE** • +150 VP")
  }
  if(c==="collection")return i.reply({
    embeds:[emb("📚 VOID COLLECTION",`💎 Relics: **${u.relics.length}**\n🏆 Achievements: **${u.achievements.length}**\n🏷️ Titles: **${u.titles.length}**\n👁️ Whispers: **${u.whispers}**\n🗺️ Explores: **${u.explores}**\n🎲 Rolls: **${u.rolls}**\n🕯️ Rituals: **${u.rituals}`,"#00A6A6")]
  });
  if(c==="streak")return i.reply(`🔥 Daily streak: **${u.streak}**\n💬 Messages: **${u.messages}**`);
  if(c==="cooldowns")return i.reply(`⏳ XP: ${Math.max(0,Math.ceil((Number(process.env.XP_COOLDOWN||60)*1000-(now()-u.lastXP))/1000))}s\n🔮 VP: ${Math.max(0,Math.ceil((Number(process.env.VP_COOLDOWN||60)*1000-(now()-u.lastVP))/1000))}s`);
  
if(c==="setup-level-roles"||c==="setup-roles"){
    if(!i.member.permissions.has(PermissionsBitField.Flags.ManageRoles)){
      return i.reply({content:"❌ Nemáš Manage Roles.",ephemeral:true});
    }
    const roles=await setupAllLevelRoles(i.guild);
    return i.reply({
      embeds:[emb("📈 RED VOID LEVEL LADDER",
        roles.map(x=>`**Level ${x.level}** → <@&${x.role.id}>`).join("\n")||
        "Nepodarilo sa pripraviť level role. Skontroluj Manage Roles.",
        "#E00000")],
      ephemeral:true
    });
}

if(c==="clear"){
    if(!i.member.permissions.has(PermissionsBitField.Flags.ManageMessages))return i.reply({
      content:"❌ Nemáš oprávnenie.",ephemeral:true
    });
    let n=i.options.getInteger("amount"),d=await i.channel.bulkDelete(n,true);
    return i.reply({
      content:`🧹 Vymazaných ${d.size} správ.`,ephemeral:true
    })
  }
  if(c==="warn"){
    let to=i.options.getUser("user"),r=i.options.getString("reason");
    db.warnings[to.id]??=[];
    db.warnings[to.id].push({
      by:i.user.id,reason:r,date:new Date().toISOString()
    });
    save();
    return i.reply(`⚠️ <@${to.id}> dostal warning: **${r}**`)
  }
  if(c==="warnings"){
    let to=i.options.getUser("user"),a=db.warnings[to.id]||[];
    return i.reply({
      embeds:[emb("⚠️ WARNINGS",a.map((x,n)=>`${n+1}. ${x.reason}`).join("\n")||"Žiadne.") ]
    })
  }
  if(c==="timeout"){
    let m=i.options.getMember("user"),min=i.options.getInteger("minutes");
    if(!m)return i.reply({
      content:"❌ Člen nenájdený.",ephemeral:true
    });
    await m.timeout(min*60000,`Red Void timeout by ${i.user.tag}`);
    return i.reply(`⏳ <@${m.id}> dostal timeout na **${min} min**.`)
  }
}
client.on("interactionCreate",async i=>{
  if(i.isButton()){
    try{
      if(i.customId==="boss_attack"){
        return await executeBossAttack(i);
      }
      if(i.customId==="boss_defend"){
        return await executeBossDefend(i);
      }
      if(i.customId==="boss_abilities"){
        const b=db.boss;
        if(!b)return i.reply({content:"👹 Boss už nie je aktívny.",ephemeral:true});
        const abilities=bossAbilities(b.name);
        return i.reply({
          embeds:[emb(`☠️ ${b.name} • ABILITIES`,
            abilities.map(x=>`> ${x}`).join("\n"),
            "#E00000")],
          ephemeral:true
        });
      }
    }catch(e){
      console.error("RED VOID BUTTON ERROR:",e);
      const x={content:"❌ Red Void narazil na chybu pri tlačidle.",ephemeral:true};
      if(i.replied||i.deferred)i.followUp(x).catch(()=>{});
      else i.reply(x).catch(()=>{});
    }
    return;
  }

  if(!i.isChatInputCommand())return;
  try{
    await run(i)
  } catch(e){
    console.error("RED VOID COMMAND ERROR:",e);
    const x={
      content:"❌ Red Void narazil na chybu. Skontroluj konzolu.",ephemeral:true
    };
    if(i.replied||i.deferred)i.followUp(x).catch(()=>{
    });
    else i.reply(x).catch(()=>{
    })
  }
});


// 🔐 Discord OAuth2 dashboard sessions.
// Access tokens stay server-side and are never sent to the browser.
const oauthStates=new Map();
const oauthSessions=new Map();
const OAUTH_COOKIE="rv_session";
function b64url(x){return Buffer.from(x).toString("base64url")}
function randomToken(){return crypto.randomBytes(32).toString("hex")}
function parseCookies(req){
  const out={};
  for(const part of (req.headers.cookie||"").split(";")){
    const [k,...v]=part.trim().split("=");
    if(k)out[k]=decodeURIComponent(v.join("="));
  }
  return out;
}
function oauthRedirect(){
  return process.env.DISCORD_REDIRECT_URI ||
    `http://localhost:${process.env.PORT||3000}/auth/callback`;
}
function oauthUrl(state){
  const q=new URLSearchParams({
    response_type:"code",
    client_id:process.env.CLIENT_ID||"",
    scope:"identify guilds",
    state,
    redirect_uri:oauthRedirect(),
    prompt:"consent"
  });
  return "https://discord.com/oauth2/authorize?"+q.toString();
}
async function discordJson(url,options={}){
  const r=await fetch(url,options);
  const text=await r.text();
  let data={}; try{data=JSON.parse(text)}catch{data={raw:text}}
  if(!r.ok)throw new Error(`Discord API ${r.status}`);
  return data;
}
function currentSession(req){
  const id=parseCookies(req)[OAUTH_COOKIE];
  return id?oauthSessions.get(id):null;
}
function safeUserProfile(id){
  const u=U(id);
  return {
    id,level:u.level,xp:u.xp,totalXP:totalXP(u),vp:u.vp,messages:u.messages,streak:u.streak,
    alignment:align(u),relics:u.relics,achievements:u.achievements,titles:u.titles,
    activeTitle:u.activeTitle,class:u.class,faction:u.faction,rep:u.rep,
    bossDamage:u.bossDamage,explores:u.explores,rolls:u.rolls,rifts:u.rifts,
    contracts:u.contracts,duels:u.duels,duelWins:u.duelWins,corruption:u.corruption,
    legacy:u.legacy,seasonXP:u.seasonXP
  };
}

// 🌐 RED VOID COMMAND NEXUS WEB + 🔐 DISCORD OAUTH2
const app=express();
const WEB=path.join(__dirname,"..","web");
app.use(express.static(WEB));

app.get("/login",(req,res)=>{
  if(!process.env.CLIENT_ID||!process.env.DISCORD_CLIENT_SECRET)
    return res.status(500).send("OAuth2 is not configured. Add CLIENT_ID, DISCORD_CLIENT_SECRET and DISCORD_REDIRECT_URI.");
  const state=randomToken();
  oauthStates.set(state,{created:Date.now()});
  setTimeout(()=>oauthStates.delete(state),10*60*1000);
  res.redirect(oauthUrl(state));
});
app.get("/auth/callback",async(req,res)=>{
  try{
    const {code,state}=req.query;
    const st=state&&oauthStates.get(state);
    if(!code||!st)return res.status(400).send("Invalid OAuth state.");
    oauthStates.delete(state);
    const body=new URLSearchParams({
      client_id:process.env.CLIENT_ID,
      client_secret:process.env.DISCORD_CLIENT_SECRET,
      grant_type:"authorization_code",
      code:String(code),
      redirect_uri:oauthRedirect()
    });
    const token=await discordJson("https://discord.com/api/v10/oauth2/token",{
      method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body
    });
    const user=await discordJson("https://discord.com/api/v10/users/@me",{
      headers:{Authorization:`Bearer ${token.access_token}`}
    });
    let member=null;
    try{
      member=await discordJson(`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${user.id}`,{
        headers:{Authorization:`Bot ${process.env.DISCORD_TOKEN}`}
      });
    }catch{}
    if(!member)return res.redirect("/?login=not-member");
    const sid=randomToken();
    oauthSessions.set(sid,{user,accessToken:token.access_token,refreshToken:token.refresh_token,expiresAt:Date.now()+Number(token.expires_in||604800)*1000,member});
    const secure=(req.headers["x-forwarded-proto"]==="https"||req.secure)?"; Secure":"";
    res.setHeader("Set-Cookie",`${OAUTH_COOKIE}=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`);
    res.redirect("/#profile");
  }catch(e){
    console.error("OAUTH CALLBACK:",e);
    res.status(500).send("Discord login failed. Check OAuth2 settings and redirect URI.");
  }
});
app.get("/logout",(req,res)=>{
  const sid=parseCookies(req)[OAUTH_COOKIE];
  if(sid)oauthSessions.delete(sid);
  const secure=(req.headers["x-forwarded-proto"]==="https"||req.secure)?" Secure":"";
  res.setHeader("Set-Cookie",`${OAUTH_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0;${secure}`);
  res.redirect("/");
});

app.get("/api/me",async(req,res)=>{
  const sess=currentSession(req);
  if(!sess)return res.json({loggedIn:false});
  if(sess.expiresAt<Date.now()){
    oauthSessions.delete(parseCookies(req)[OAUTH_COOKIE]);
    return res.json({loggedIn:false});
  }
  let member=sess.member;
  try{
    member=await discordJson(`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${sess.user.id}`,{
      headers:{Authorization:`Bot ${process.env.DISCORD_TOKEN}`}
    });
    sess.member=member;
  }catch{}
  const guild=client.guilds.cache.get(process.env.GUILD_ID);
  res.json({
    loggedIn:true,
    user:{id:sess.user.id,username:sess.user.username,global_name:sess.user.global_name,avatar:sess.user.avatar},
    profile:safeUserProfile(sess.user.id),
    roles:(member?.roles||[]).map(id=>guild?.roles.cache.get(id)?.name).filter(Boolean),
    guild:guild?{name:guild.name,icon:guild.iconURL({size:256}),banner:guild.bannerURL({size:1024})}:null
  });
});


app.get("/api/leaderboard",(req,res)=>{
  const rows=Object.entries(db.users||{}).map(([id,u])=>{
    const n=normalizeUser(u);
    return {id,level:n.level,xp:n.xp,totalXP:totalXP(n),vp:n.vp,bossDamage:n.bossDamage||0,seasonXP:n.seasonXP||0,title:n.activeTitle||"",class:n.class||"",faction:n.faction||""};
  }).sort((a,b)=>b.level-a.level||b.xp-a.xp||b.seasonXP-a.seasonXP).slice(0,25);
  res.json({rows});
});
app.get("/api/boss",(req,res)=>{
  const b=db.boss;
  if(!b)return res.json({active:false});
  res.json({
    active:b.ends>now(),name:b.name,hp:b.hp,maxHp:b.maxHp,
    phase:typeof bossPhase==="function"?bossPhase(b):{name:"NORMAL",mult:1},
    attackers:Object.entries(b.attackers||{}).sort((a,z)=>z[1]-a[1]).slice(0,10).map(([id,damage])=>({id,damage}))
  });
});

app.get("/api/dashboard",(req,res)=>{
  const shop=[
    {id:"voidboost",name:"Void Boost",icon:"⚡",price:250,description:"+100 XP"},
    {id:"relicbox",name:"Relic Box",icon:"💎",price:500,description:"Random Void Relic"},
    {id:"voidtitle",name:"Void Title",icon:"👑",price:1500,description:"Random Title"},
    {id:"factionseal",name:"Faction Seal",icon:"🔱",price:750,description:"+50 Reputation"},
    {id:"bloodelixir",name:"Blood Elixir",icon:"🩸",price:900,description:"+500 XP"},
    {id:"riftkey",name:"Rift Key",icon:"🕳️",price:1200,description:"Rift access"}
  ];
  const commands=[
    ["profile","profile","Your Void profile"],["rank","profile","XP and level"],["balance","economy","Void Points"],["daily","economy","Daily reward"],["pay","economy","Transfer VP"],
    ["shop","shop","Void Market"],["buy","shop","Buy an item"],["event","event","Current world event"],["roll","roll","Roll the Void Dice"],["fate","fate","Ask the Void"],["curse","curse","Current curse"],["whisper","whisper","Void whisper"],["ritual","ritual","Ritual"],
    ["rift","rift","Create/view a Rift"],["rift-join","rift","Join a Rift"],["boss","boss","World Boss"],["attack","boss","Attack the Boss"],["duel","duel","Challenge a player"],["bounty","bounty","Bounty"],["bounties","bounty","Bounty board"],["quest","quest","Quest"],["contracts","quest","Void Contracts"],["trial","quest","Daily Void Trial"],["trial-claim","quest","Claim Trial reward"],
    ["map","map","Void Map"],["explore","map","Explore"],["war","war","Faction War"],["leaderboard","leaderboard","Leaderboard"],["season","leaderboard","Season"],["relics","profile","Your Relics"],["achievements","profile","Achievements"],["titles","profile","Titles"],["classes","profile","Classes"],["factions","profile","Factions"],["reputation","profile","Reputation"],["evolution","profile","Evolution"],["corruption","profile","Corruption"],["legacy","profile","Legacy"],["void","profile","Void identity"],["server-stats","server-stats","Server statistics"],["bot-control","bot-control","Bot Control"],["command-log","bot-control","Command log"],["help","bot-commands","Command Center"]
  ];
  res.json({online:client.isReady(),users:Object.keys(db.users||{}).length,boss:db.boss?{name:db.boss.name,hp:db.boss.hp,maxHp:db.boss.maxHp,active:db.boss.ends>now()}:null,event:db.event?{name:db.event.name,active:db.event.ends>now()}:null,shop,commands:commands.map(x=>({name:x[0],channel:x[1],description:x[2]}))});
});
const PORT=Number(process.env.PORT||3000);
app.listen(PORT,"0.0.0.0",()=>console.log(`🌐 RED VOID WEB: http://0.0.0.0:${PORT}`));

client.login(process.env.DISCORD_TOKEN);function bossGifAttachment(b){
  const base=BOSS_ART[b.name]||"the_red_abyss.png";
  const gifName=base.replace(".png","_hp.gif");
  const p=asset(gifName);
  return fs.existsSync(p)?new AttachmentBuilder(p,{name:"boss_hp.gif"}):null;
}

