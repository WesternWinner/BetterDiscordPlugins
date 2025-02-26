/**
 * @name MessageLoggerV2
 * @version 1.8.35
 * @invite NYvWdN5
 * @donate https://paypal.me/lighty13
 * @website https://1lighty.github.io/BetterDiscordStuff/?plugin=MessageLoggerV2
 * @source https://github.com/1Lighty/BetterDiscordPlugins/blob/master/Plugins/MessageLoggerV2/MessageLoggerV2.plugin.js
 * @updateUrl https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/MessageLoggerV2/MessageLoggerV2.plugin.js
 */
/*@cc_on
@if (@_jscript)
  // Offer to self-install for clueless users that try to run this directly.
  var shell = WScript.CreateObject('WScript.Shell');
  var fs = new ActiveXObject('Scripting.FileSystemObject');
  var pathPlugins = shell.ExpandEnvironmentStrings('%APPDATA%\\BetterDiscord\\plugins');
  var pathSelf = WScript.ScriptFullName;
  // Put the user at ease by addressing them in the first person
  shell.Popup('It looks like you\'ve mistakenly tried to run me directly. \n(Don\'t do that!)', 0, 'I\'m a plugin for BetterDiscord', 0x30);
  if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
    shell.Popup('I\'m in the correct folder already.\nJust go to settings, plugins and enable me.', 0, 'I\'m already installed', 0x40);
  } else if (!fs.FolderExists(pathPlugins)) {
    shell.Popup('I can\'t find the BetterDiscord plugins folder.\nAre you sure it\'s even installed?', 0, 'Can\'t install myself', 0x10);
  } else if (shell.Popup('Should I copy myself to BetterDiscord\'s plugins folder for you?', 0, 'Do you need some help?', 0x34) === 6) {
    fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
    // Show the user where to put plugins in the future
    shell.Exec('explorer ' + pathPlugins);
    shell.Popup('I\'m installed!\nJust go to settings, plugins and enable me!', 0, 'Successfully installed', 0x40);
  }
  WScript.Quit();
@else @*/
/*
 * Copyright © 2019-2023, _Lighty_
 * All rights reserved.
 * Code may not be redistributed, modified or otherwise taken without explicit permission.
 */

const MLV2_TYPE_L1 = Symbol('MLV2_TYPE_L1');
const MLV2_TYPE_L2 = Symbol('MLV2_TYPE_L2');
const MLV2_TYPE_L3 = Symbol('MLV2_TYPE_L3');

module.exports = class MessageLoggerV2 {
  getName() {
    return 'MessageLoggerV2';
  }
  getVersion() {
    return '1.8.35';
  }
  getAuthor() {
    return 'Lighty';
  }
  getDescription() {
    return 'Saves all deleted and purged messages, as well as all edit history and ghost pings. With highly configurable ignore options, and even restoring deleted messages after restarting Discord. Now also logs all messages continuously to daily HTML files.';
  }
  load() { }
  start() {
    let onLoaded = () => {
      try {
        if (global.ZeresPluginLibrary && !this.UserStore) this.UserStore = ZeresPluginLibrary.WebpackModules.getByProps('getCurrentUser', 'getUser');
        if (!global.ZeresPluginLibrary || !this.UserStore || !(this.localUser = this.UserStore.getCurrentUser())) setTimeout(onLoaded, 1000);
        else this.initialize();
      } catch (err) {
        ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Failed to start!', err);
        ZeresPluginLibrary.Logger.err(this.getName(), `If you cannot solve this yourself, contact ${this.getAuthor()} and provide the errors shown here.`);
        this.stop();
        XenoLib.Notifications.error(`[**${this.getName()}**] Failed to start! Try to CTRL + R, or update the plugin, like so\n![image](https://i.imgur.com/tsv6aW8.png)`, { timeout: 0 });
      }
    };
    this.pluginDir = (BdApi.Plugins && BdApi.Plugins.folder) || window.ContentManager.pluginsFolder;
    this.__isPowerCord = !!window.powercord && typeof BdApi.__getPluginConfigPath === 'function' || typeof global.isTab !== 'undefined';
    let XenoLibOutdated = false;
    let ZeresPluginLibraryOutdated = false;
    if (global.BdApi && BdApi.Plugins && typeof BdApi.Plugins.get === 'function') {
      const versionChecker = (a, b) => ((a = a.split('.').map(a => parseInt(a))), (b = b.split('.').map(a => parseInt(a))), !!(b[0] > a[0])) || !!(b[0] == a[0] && b[1] > a[1]) || !!(b[0] == a[0] && b[1] == a[1] && b[2] > a[2]);
      const isOutOfDate = (lib, minVersion) => lib && lib._config && lib._config.info && lib._config.info.version && versionChecker(lib._config.info.version, minVersion) || typeof global.isTab !== 'undefined';
      let iXenoLib = BdApi.Plugins.get('XenoLib');
      let iZeresPluginLibrary = BdApi.Plugins.get('ZeresPluginLibrary');
      if (iXenoLib && iXenoLib.instance) iXenoLib = iXenoLib.instance;
      if (iZeresPluginLibrary && iZeresPluginLibrary.instance) iZeresPluginLibrary = iZeresPluginLibrary.instance;
      if (isOutOfDate(iXenoLib, '1.4.21')) XenoLibOutdated = true;
      if (isOutOfDate(iZeresPluginLibrary, '2.0.23')) ZeresPluginLibraryOutdated = true;
    }
    if (!BdApi.Plugins.get('XenoLib') || XenoLibOutdated) {
      this._XL_PLUGIN = true;
      const fs = require('fs');
      const path = require('path');
      const pluginsDir = (BdApi.Plugins && BdApi.Plugins.folder) || (window.ContentManager && window.ContentManager.pluginsFolder);
      const xenoLibPath = path.join(pluginsDir, '1XenoLib.plugin.js');
      BdApi.Net.fetch('https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/refs/heads/master/Plugins/1XenoLib.plugin.js', { headers: { origin: 'discord.com' } })
        .then(r => {
          if (!r.ok) {
            throw new Error('Network request threw error ' + r.statusText);
          }
          return r.text();
        })
        .then(data => {
          fs.writeFileSync(xenoLibPath, data);
        })
        .catch(err => {
          console.error('Error downloading XenoLib!', err);
          BdApi.UI.showConfirmationModal('XenoLib Missing',
            `XenoLib is missing! Click the GitHub link below and press CTRL + S to download it, then put it in your plugins folder!\n\nYou can find the plugins folder by going to Settings > Plugins and clicking the folder icon!\n\nhttps://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/1XenoLib.plugin.js`, {
              confirmText: 'Got it',
              cancelText: null
            });
        });
    } else onLoaded();
  }
  stop() {
    try {
      this.shutdown();
      const currLocation = globalThis?.location?.pathname;
      ZeresPluginLibrary?.DiscordModules?.NavigationUtils?.transitionTo('/channels/@me');
      if (currLocation) setTimeout(() => ZeresPluginLibrary.DiscordModules.NavigationUtils.transitionTo(currLocation), 500);
    } catch (err) {
      // ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Failed to stop!', err);
    }
  }
  getChanges() {
    return [
      {
        title: 'Fixed',
        type: 'fixed',
        items: ['Fixed menu, dum bug']
      }
    ];
  }
  initialize() {
    if (this.__started) return XenoLib.Notifications.warning(`[**${this.getName()}**] Tried to start twice..`, { timeout: 0 });
    this.__started = true;
    const _zerecantcode_path = require('path');
    const theActualFileNameZere = _zerecantcode_path.join(__dirname, _zerecantcode_path.basename(__filename));
    XenoLib.changeName(theActualFileNameZere, 'MessageLoggerV2');
    try {
      ZeresPluginLibrary.WebpackModules.getByProps('openModal', 'hasModalOpen').closeModal(`${this.getName()}_DEP_MODAL`);
    } catch (e) { }
    try {
      ZeresPluginLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), 'https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/MessageLoggerV2/MessageLoggerV2.plugin.js');
    } catch (err) { }
    if (window.PluginUpdates && window.PluginUpdates.plugins) delete PluginUpdates.plugins['https://gitlab.com/_Lighty_/bdstuff/raw/master/public/plugins/MessageLoggerV2.plugin.js'];
    if (BdApi.Plugins && BdApi.Plugins.get('NoDeleteMessages') && BdApi.Plugins.isEnabled('NoDeleteMessages')) XenoLib.Notifications.warning(`[**${this.getName()}**] Using **NoDeleteMessages** with **${this.getName()}** is completely unsupported and will cause issues. Please either disable **NoDeleteMessages** or delete it to avoid issues.`, { timeout: 0 });
    if (BdApi.Plugins && BdApi.Plugins.get('SuppressUserMentions') && BdApi.Plugins.isEnabled('SuppressUserMentions')) XenoLib.Notifications.warning(`[**${this.getName()}**] Using **SuppressUserMentions** with **${this.getName()}** is completely unsupported and will cause issues. Please either disable **SuppressUserMentions** or delete it to avoid issues.`, { timeout: 0 });
    const shouldPass = e => e && e.constructor && typeof e.constructor.name === 'string' && e.constructor.name.indexOf('HTML');
    let defaultSettings = {
      obfuscateCSSClasses: true,
      autoBackup: false,
      dontSaveData: false,
      displayUpdateNotes: true,
      ignoreMutedGuilds: true,
      ignoreMutedChannels: true,
      ignoreBots: true,
      ignoreSelf: false,
      ignoreBlockedUsers: true,
      ignoreNSFW: false,
      ignoreLocalEdits: false,
      ignoreLocalDeletes: false,
      alwaysLogGhostPings: false,
      showOpenLogsButton: true,
      messageCacheCap: 1000,
      savedMessagesCap: 1000,
      reverseOrder: true,
      onlyLogWhitelist: true,
      whitelist: [],
      blacklist: [],
      notificationBlacklist: [],
      toastToggles: {
        sent: false,
        edited: true,
        deleted: true,
        ghostPings: true
      },
      toastTogglesDMs: {
        sent: false,
        edited: true,
        deleted: true,
        ghostPings: true,
        disableToastsForLocal: false
      },
      useNotificationsInstead: true,
      blockSpamEdit: false,
      disableKeybind: false,
      cacheAllImages: true,
      dontDeleteCachedImages: false,
      aggresiveMessageCaching: true,
      renderCap: 50,
      maxShownEdits: 0,
      hideNewerEditsFirst: true,
      displayDates: true,
      deletedMessageColor: '',
      editedMessageColor: '',
      useAlternativeDeletedStyle: false,
      showEditedMessages: true,
      showDeletedMessages: true,
      showPurgedMessages: true,
      showDeletedCount: true,
      showEditedCount: true,
      alwaysLogSelected: true,
      alwaysLogDM: true,
      restoreDeletedMessages: true,
      contextmenuSubmenuName: 'Message Logger',
      streamSafety: {
        showEdits: false,
        showDeletes: false,
        showButton: false,
        showNotifications: false,
        showContextMenu: false
      },
      imageCacheDir: this.pluginDir + '/MLV2_IMAGE_CACHE',
      flags: 0,
      autoUpdate: true,
      versionInfo: ''
    };
    const Flags = {
      STOLEN: 1 << 0,
      STARTUP_HELP: 1 << 1
    };

    this.settings = ZeresPluginLibrary.PluginUtilities.loadSettings(this.getName(), defaultSettings);
    let settingsChanged = false;

    if (!this.settings || !Object.keys(this.settings).length) {
      XenoLib.Notifications.error(`[${this.getName()}] Settings file corrupted! All settings restored to default.`, { timeout: 0 });
      this.settings = defaultSettings;
      settingsChanged = true;
    }
    if (this.settings.versionInfo === '1.7.55') {
      this.settings = defaultSettings;
      settingsChanged = true;
    }
    if (this.settings.autoUpdate) {
      if (this._autoUpdateInterval) clearInterval(this._autoUpdateInterval);
      this._autoUpdateInterval = setInterval(_ => this.automaticallyUpdate(), 1000 * 60 * 60);
      this.automaticallyUpdate();
    }
    if (this.settings.versionInfo !== this.getVersion() && this.settings.displayUpdateNotes) {
      if (this.settings.versionInfo === '1.8.31') {
        const currLocation = globalThis?.location?.pathname;
        ZeresPluginLibrary?.DiscordModules?.NavigationUtils?.transitionTo('/channels/@me');
        if (currLocation) setTimeout(() => ZeresPluginLibrary.DiscordModules.NavigationUtils.transitionTo(currLocation), 500);
      }
      XenoLib.showChangelog(`${this.getName()} has been updated!`, this.getVersion(), this.getChanges());
      this.settings.versionInfo = this.getVersion();
      this.saveSettings();
      settingsChanged = false;
    }

    if (settingsChanged) this.saveSettings();

    this.nodeModules = {
      electron: require('electron'),
      request: require('request'),
      fs: require('fs'),
      path: require('path')
    };

    let defaultConstruct = () => {
      return Object.assign(
        {},
        {
          messageRecord: {},
          deletedMessageRecord: {},
          editedMessageRecord: {},
          purgedMessageRecord: {}
        }
      );
    };
    let data;
    if (this.settings.dontSaveData) {
      data = defaultConstruct();
    } else {
      data = XenoLib.loadData(this.getName() + 'Data', 'data', defaultConstruct(), true);
      const isBad = map => !(map && map.messageRecord && map.editedMessageRecord && map.deletedMessageRecord && map.purgedMessageRecord && typeof map.messageRecord == 'object' && typeof map.editedMessageRecord == 'object' && typeof map.deletedMessageRecord == 'object' && typeof map.purgedMessageRecord == 'object');
      if (isBad(data)) {
        if (this.settings.autoBackup) {
          data = XenoLib.loadData(this.getName() + 'DataBackup', 'data', defaultConstruct(), true);
          if (isBad(data)) {
            XenoLib.Notifications.error(`[${this.getName()}] Data and backup files were corrupted. All deleted/edited/purged messages have been erased.`, { timeout: 0 });
            data = defaultConstruct();
          } else {
            XenoLib.Notifications.warning(`[${this.getName()}] Data was corrupted, loaded backup!`, { timeout: 5000 });
          }
        } else {
          XenoLib.Notifications.error(`[${this.getName()}] Data was corrupted! Recommended to turn on auto backup in settings! All deleted/edited/purged messages have been erased.`, { timeout: 0 });
          data = defaultConstruct();
        }
      }
    }

    this.messageStore = ZeresPluginLibrary.WebpackModules.getByProps('getMessages', 'getMessage');

    this.ChannelStore = ZeresPluginLibrary.WebpackModules.getByProps('getChannel', 'getDMFromUserId');
    if (!this.settings.dontSaveData) {
      const records = data.messageRecord;
      for (let a in records) {
        const record = records[a];
        if (record.deletedata) {
          if (record.deletedata.deletetime) {
            record.delete_data = {};
            record.delete_data.time = record.deletedata.deletetime;
          }
          delete record.deletedata;
        } else if (record.delete_data && typeof record.delete_data.rel_ids !== 'undefined') delete record.delete_data.rel_ids;
        if (record.editHistory) {
          record.edit_history = [];
          for (let b in record.editHistory) {
            record.edit_history.push({ content: record.editHistory[b].content, time: record.editHistory[b].editedAt });
          }
          delete record.editHistory;
        }
        record.message = this.cleanupMessageObject(record.message);
      }
    }

    this.cachedMessageRecord = [];
    this.messageRecord = data.messageRecord;
    this.deletedMessageRecord = data.deletedMessageRecord;
    this.editedMessageRecord = data.editedMessageRecord;
    this.purgedMessageRecord = data.purgedMessageRecord;
    this.tempEditedMessageRecord = {};
    this.editHistoryAntiSpam = {};
    this.localDeletes = [];

    this.settings.imageCacheDir = this.pluginDir + '/MLV2_IMAGE_CACHE';

    const imageCacheDirFailure = () => {
      this.settings.imageCacheDir = this.pluginDir + '/MLV2_IMAGE_CACHE';
      XenoLib.Notifications.error(`[**${this.getName()}**] Failed to access custom image cache dir. It has been reset to plugins folder!`);
    };

    if (this.settings.cacheAllImages && !this.nodeModules.fs.existsSync(this.settings.imageCacheDir)) {
      try {
        this.nodeModules.fs.mkdirSync(this.settings.imageCacheDir);
      } catch (e) {
        imageCacheDirFailure();
      }
    }

    if (!this._imageCacheServer) {
      class ImageCacheServer {
        constructor(imagePath, name) {
          try {
            ZeresPluginLibrary.WebpackModules.getByProps('bindAll', 'debounce').bindAll(this, ['_requestHandler', '_errorHandler']);
            this._server = require('http').createServer(this._requestHandler);
            this._getMimetype = require('mime-types').lookup;
            this._parseURL = require('url').parse;
            this._fs = require('fs');
            this._path = require('path');
            this._imagePath = imagePath;
            this._name = name;
          } catch (err) {
            //ZeresPluginLibrary.Logger.err(this._name, 'Error in ImageCacheServer', err);
          }
        }
        start() {
          try {
            this._server.listen(7474, 'localhost', this._errorHandler);
          } catch (err) {
            //ZeresPluginLibrary.Logger.err(this._name, 'Error in ImageCacheServer', err);
          }
        }
        stop() {
          try {
            this._server.close();
          } catch (err) {
            //ZeresPluginLibrary.Logger.err(this._name, 'Error in ImageCacheServer', err);
          }
        }
        _errorHandler(err) {
          if (err) return ZeresPluginLibrary.Logger.err(this._name, 'ImageCacheServer error:', err);
          ZeresPluginLibrary.Logger.info(this._name, 'ImageCacheServer: OK');
        }
        _requestHandler(req, res) {
          const parsedUrl = this._parseURL(req.url);
          const parsedFile = this._path.parse(parsedUrl.pathname);
          let pathname = this._path.join(this._imagePath, parsedFile.base);
          this._fs.readFile(pathname, (err, data) => {
            if (err) {
              res.statusCode = 404;
              res.end(`No such file: ${err}.`);
            } else {
              res.setHeader('Content-type', this._getMimetype(parsedFile.ext));
              res.end(data);
            }
          });
        }
      }
      this._imageCacheServer = new ImageCacheServer(this.settings.imageCacheDir, this.getName());
    }
    this._imageCacheServer.start();

    // Initialize daily HTML log
    this.initializeDailyHTMLLog();

    defaultConstruct = undefined;

    const CUser = ZeresPluginLibrary.WebpackModules.getByPrototypes('getAvatarSource', 'isLocalBot');
    const userRecord = {};
    const lastSeenUser = {};
    for (const messageId in this.messageRecord) {
      const record = this.messageRecord[messageId];
      const userObj = record.message.author;
      if (!userObj || typeof userObj === 'string') continue;
      const date = new Date(record.message.timestamp);
      if (!(userRecord[userObj.id] && lastSeenUser[userObj.id] && lastSeenUser[userObj.id] > date)) {
        userRecord[userObj.id] = userObj;
        lastSeenUser[userObj.id] = date;
      }
    }

    this.Patcher = XenoLib.createSmartPatcher({ before: (moduleToPatch, functionName, callback, options = {}) => ZeresPluginLibrary.Patcher.before(this.getName(), moduleToPatch, functionName, callback, options), instead: (moduleToPatch, functionName, callback, options = {}) => ZeresPluginLibrary.Patcher.instead(this.getName(), moduleToPatch, functionName, callback, options), after: (moduleToPatch, functionName, callback, options = {}) => ZeresPluginLibrary.Patcher.after(this.getName(), moduleToPatch, functionName, callback, options) });

    this.unpatches = [];

    this.unpatches.push(
      this.Patcher.after(this.UserStore, 'getUser', (_this, args, ret) => {
        if (!ret && !args[1]) {
          const userId = args[0];
          const users = this.UserStore.getUsers();
          if (userRecord[userId]) return (users[userId] = new CUser(userRecord[userId]));
        }
      })
    );

    const isMentioned = ZeresPluginLibrary.WebpackModules.getModule(e => typeof e === 'function' && e?.toString()?.includes('mentionEveryone') && e?.toString()?.includes('roles.includes'), { searchExports: true });

    this.tools = {
      openUserContextMenu: null,
      getMessage: this.messageStore.getMessage,
      fetchMessages: ZeresPluginLibrary.DiscordModules.MessageActions.fetchMessages.bind(ZeresPluginLibrary.DiscordModules.MessageActions),
      transitionTo: null,
      getChannel: this.ChannelStore.getChannel,
      copyToClipboard: global.copy,
      getServer: ZeresPluginLibrary.WebpackModules.getByProps('getGuild', 'getGuildCount').getGuild,
      getUser: this.UserStore.getUser,
      parse: ZeresPluginLibrary.WebpackModules.getByProps('parse', 'astParserFor').parse,
      getUserAsync: () => Promise.resolve(),
      isBlocked: ZeresPluginLibrary.WebpackModules.getByProps('isBlocked').isBlocked,
      createMomentObject: ZeresPluginLibrary.WebpackModules.getByProps('createFromInputFallback'),
      isMentioned: (e, id) => isMentioned({ userId: id, channelId: e.channel_id, mentionEveryone: e.mentionEveryone || e.mention_everyone, mentionUsers: e.mentions.map(e => e.id || e), mentionRoles: e.mentionRoles || e.mention_roles }),
      DiscordUtils: ZeresPluginLibrary.WebpackModules.getByProps('bindAll', 'debounce')
    };

    this.createButton.classes = {
      button: (function () {
        let buttonData = ZeresPluginLibrary.WebpackModules.getByProps('button', 'colorBrand');
        return `${buttonData.button} ${buttonData.lookFilled} ${buttonData.colorBrand} ${buttonData.sizeSmall} ${buttonData.grow}`;
      })(),
      buttonContents: ZeresPluginLibrary.WebpackModules.getByProps('button', 'colorBrand').contents
    };

    this.safeGetClass = (func, fail, heckoff) => {
      try {
        return func();
      } catch (e) {
        if (heckoff) return fail;
        return fail + '-MLV2';
      }
    };

    this.createMessageGroup.classes = {
      containerBounded: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').containerCozyBounded, 'containerCozyBounded'),
      message: this.safeGetClass(() => `.${ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').containerCozyBounded.split(/ /g)[0]} > div`, '.containerCozyBounded-MLV2 > div', true),
      header: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').headerCozy, 'headerCozy'),
      avatar: this.safeGetClass(() => XenoLib.getClass('header avatar', true), 'avatar'),
      headerMeta: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').headerCozyMeta, 'headerCozyMeta'),
      username: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').username, 'username'),
      timestamp: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').timestampCozy, 'timestampCozy'),
      timestampSingle: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').timestampCozy.split(/ /g)[0], 'timestampCozy'),
      content: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').contentCozy, 'contentCozy'),
      avatarSingle: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').avatar.split(/ /g)[0], 'avatar'),
      avatarImg: XenoLib.getClass('clickable avatar'),
      avatarImgSingle: XenoLib.getSingleClass('clickable avatar'),
      botTag: ZeresPluginLibrary.WebpackModules.getByProps('botTagRegular').botTagRegular + ' ' + ZeresPluginLibrary.WebpackModules.getByProps('botTagCozy').botTagCozy,
      markupSingle: ZeresPluginLibrary.WebpackModules.getByProps('markup').markup.split(/ /g)[0]
    };

    this.multiClasses = {
      defaultColor: ZeresPluginLibrary.WebpackModules.getByProps('defaultColor').defaultColor,
      item: ZeresPluginLibrary.WebpackModules.find(m => m.item && m.selected && m.topPill).item,
      tabBarContainer: ZeresPluginLibrary.DiscordClassModules.UserModal?.tabBarContainer,
      tabBar: ZeresPluginLibrary.DiscordClassModules.UserModal?.tabBar,
      edited: XenoLib.joinClassNames(XenoLib.getClass('separator timestamp'), XenoLib.getClass('separator timestampInline')),
      markup: ZeresPluginLibrary.WebpackModules.getByProps('markup')['markup'],
      message: {
        cozy: {
          containerBounded: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').containerCozyBounded, 'containerCozyBounded'),
          header: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').headerCozy, 'headerCozy'),
          avatar: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').avatar, 'avatar'),
          headerMeta: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').headerCozyMeta, 'headerCozyMeta'),
          username: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').username, 'username'),
          timestamp: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').timestampCozy, 'timestampCozy'),
          content: this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').contentCozy, 'contentCozy')
        }
      }
    };

    this.classes = {
      markup: ZeresPluginLibrary.WebpackModules.getByProps('markup')['markup'].split(/ /g)[0],
      hidden: ZeresPluginLibrary.WebpackModules.getByProps('spoilerContent', 'hidden').hidden.split(/ /g)[0],
      avatar: this.safeGetClass(() => XenoLib.getSingleClass('header avatar', true), 'avatar-MLV2')
    };

    this.muteModule = ZeresPluginLibrary.WebpackModules.find(m => m.isChannelMuted);

    this.menu = {};
    this.menu.classes = {};
    this.menu.filter = '';
    this.menu.open = false;

    const chatContent = ZeresPluginLibrary.WebpackModules.getByProps('chatContent');
    this.observer.chatContentClass = ((chatContent && chatContent.chatContent) || 'chat-3bRxxu').split(/ /g)[0];
    this.observer.chatClass = 'chat-3bRxxu';
    this.observer.titleClass = !chatContent ? 'ERROR-CLASSWTF' : ZeresPluginLibrary.WebpackModules.getByProps('title', 'chatContent').title.split(/ /g)[0];
    this.observer.containerCozyClass = this.safeGetClass(() => ZeresPluginLibrary.WebpackModules.getByProps('containerCozyBounded').containerCozyBounded.split(/ /g)[0], 'containerCozyBounded');

    this.localUser = this.UserStore.getCurrentUser();

    this.deletedChatMessagesCount = {};
    this.editedChatMessagesCount = {};

    this.channelMessages = ZeresPluginLibrary.WebpackModules.find(m => m._channelMessages)._channelMessages;

    this.autoBackupSaveInterupts = 0;

    this.dispatcher = ZeresPluginLibrary.WebpackModules.find(e => e.dispatch && e.subscribe);

    this.unpatches.push(
      this.Patcher.instead(
        this.dispatcher,
        'dispatch',
        (_, args, original) => this.onDispatchEvent(args, original)
      )
    );
    this.unpatches.push(
      this.Patcher.instead(ZeresPluginLibrary.DiscordModules.MessageActions, 'startEditMessage', (_, args, original) => {
        const channelId = args[0];
        const messageId = args[1];
        if (this.deletedMessageRecord[channelId] && this.deletedMessageRecord[channelId].indexOf(messageId) !== -1) return;
        return original(...args);
      })
    );

    this.noTintIds = [];
    this.editModifiers = {};

    this.style = {};

    this.style.deleted = this.obfuscatedClass('ml2-deleted');
    this.style.deletedAlt = this.obfuscatedClass('ml2-deleted-alt');
    this.style.edited = this.obfuscatedClass('ml2-edited');
    this.style.editedCompact = this.obfuscatedClass('ml2-edited-compact');
    this.style.tab = this.obfuscatedClass('ml2-tab');
    this.style.tabSelected = this.obfuscatedClass('ml2-tab-selected');
    this.style.textIndent = this.obfuscatedClass('ml2-help-text-indent');
    this.style.menuModalLarge = this.obfuscatedClass('MLv2-menu-modal-large');
    this.style.menu = this.obfuscatedClass('ML2-MENU');
    this.style.openLogs = this.obfuscatedClass('ML2-OL');
    this.style.filter = this.obfuscatedClass('ML2-FILTER');
    this.style.menuMessages = this.obfuscatedClass('ML2-MENU-MESSAGES');
    this.style.menuTabBar = this.obfuscatedClass('ML2-MENU-TABBAR');
    this.style.menuRoot = this.obfuscatedClass('MLv2-menu-root');
    this.style.imageRoot = this.obfuscatedClass('MLv2-image-root');
    this.style.inputWrapper = this.obfuscatedClass('MLv2-input-wrapper');
    this.style.multiInput = this.obfuscatedClass('MLv2-input');
    this.style.multiInputFirst = this.obfuscatedClass('MLv2-input-first');
    this.style.input = this.obfuscatedClass('MLv2-input-input');
    this.style.questionMark = this.obfuscatedClass('MLv2-question-mark');
    this.style.tabBarContainer = this.obfuscatedClass('MLv2-tab-bar-container');
    this.style.tabBar = this.obfuscatedClass('MLv2-tab-bar');
    this.style.tabBarItem = this.obfuscatedClass('MLv2-tab-bar-item');

    this.invalidateAllChannelCache();
    this.selectedChannel = this.getSelectedTextChannel();
    if (this.selectedChannel) this.cacheChannelMessages(this.selectedChannel.id);

    ZeresPluginLibrary.PluginUtilities.addStyle(
      (this.style.css = !this.settings.obfuscateCSSClasses ? 'ML2-CSS' : this.randomString()),
      `
        .${this.style.deleted} .${this.classes.markup}, .${this.style.deleted} .${this.classes.markup} .hljs, .${this.style.deleted} .container-1ov-mD *{
            color: #f04747 !important;
        }
        html #app-mount .${this.style.deletedAlt} {
          background-color: rgba(240, 71, 71, 0.15) !important;
        }
        html #app-mount .${this.style.deletedAlt}:hover, html #app-mount .${this.style.deletedAlt}.selected-2P5D_Z {
          background-color: rgba(240, 71, 71, 0.10) !important;
        }
        .theme-dark .${this.classes.markup}.${this.style.edited} .${this.style.edited} {
            filter: brightness(70%);
        }
        .theme-light .${this.classes.markup}.${this.style.edited} .${this.style.edited} {
            opacity: 0.5;
        }
        .${this.style.editedCompact} {
            text-indent: 0;
        }
        .theme-dark .${this.style.deleted}:not(:hover) img:not(.${this.classes.avatar}), .${this.style.deleted}:not(:hover) .mention, .${this.style.deleted}:not(:hover) .reactions, .${this.style.deleted}:not(:hover) a {
            filter: grayscale(100%) !important;
        }
        .${this.style.deleted} img:not(.${this.classes.avatar}), .${this.style.deleted} .mention, .${this.style.deleted} .reactions, .${this.style.deleted} a {
            transition: filter 0.3s !important;
        }
        .theme-dark .${this.style.tab} {
            border-color: transparent;
            color: rgba(255, 255, 255, 0.4);
            padding: 0px 24px;
        }
        .theme-light .${this.style.tab} {
            border-color: transparent;
            color: rgba(0, 0, 0, 0.4);
            padding: 0px 24px;
        }
        #sent.${this.style.tab} {
          display: none;
        }
        .${this.style.menuModalLarge} {
          width: 960px;
        }
        .theme-dark  .${this.style.tabSelected} {
            border-color: rgb(255, 255, 255);
            color: rgb(255, 255, 255);
        }
        .theme-light  .${this.style.tabSelected} {
            border-color: rgb(0, 0, 0);
            color: rgb(0, 0, 0);
        }
        #${this.style.menuTabBar} {
          justify-content: space-around;
        }
        .${this.style.textIndent} {
            margin-left: 40px;
        }
        .${this.style.imageRoot} {
          pointer-events: all;
        }
        #${this.style.menuMessages} {
          max-height: 0px;
        }
        .${this.style.menuRoot} .${XenoLib.getSingleClass('base wrapper')} {
          width: 100%;
        }
        .${this.style.menuRoot} .${this.style.questionMark} {
          margin-left: 5px;
        }
        .${this.style.menuRoot} h1[data-text-variant^="heading"] {
          width: 100%;
        }
        .${this.style.menuRoot} {
          width: 960px;
        }
        #${this.style.filter} {
          opacity: 1;
        }
        .${this.style.inputWrapper} {
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          -ms-flex-direction: column;
          flex-direction: column;
        }
        .${this.style.multiInput} {
          font-size: 16px;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
          width: 100%;
          border-radius: 3px;
          color: var(--text-normal);
          background-color: var(--deprecated-text-input-bg);
          border: 1px solid var(--deprecated-text-input-border);
          -webkit-transition: border-color .2s ease-in-out;
          transition: border-color .2s ease-in-out;
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -webkit-box-align: center;
          -ms-flex-align: center;
          align-items: center;
        }
        .${this.style.multiInputFirst} {
          -webkit-box-flex: 1;
          -ms-flex-positive: 1;
          flex-grow: 1;
        }
        .${this.style.input} {
          font-size: 16px;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
          width: 100%;
          border-radius: 3px;
          color: var(--text-normal);
          background-color: var(--deprecated-text-input-bg);
          border: 1px solid var(--deprecated-text-input-border);
          -webkit-transition: border-color .2s ease-in-out;
          transition: border-color .2s ease-in-out;
          padding: 10px;
          height: 40px;
          border: none;
          background-color: transparent;
        }
        .${this.style.questionMark} {
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -webkit-box-align: center;
          -ms-flex-align: center;
          align-items: center;
          -webkit-box-pack: center;
          -ms-flex-pack: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 2px;
          margin-right: 4px;
          padding: 0;
          min-width: 0;
          min-height: 0;
          background-color: var(--brand-experiment);
        }
        .${this.style.tabBarContainer} {
          border-bottom: 1px solid var(--background-modifier-accent);
          padding-left: 20px;
        }
        .${this.style.tabBar} {
          display: flex;
          height: 55px;
          align-items: stretch;
          -ms-flex-align: stretch;
          -webkit-box-align: stretch;
        }
        .${this.style.tabBarItem} {
          display: flex;
          font-size: 14px;
          margin-right: 40px;
          border-bottom: 2px solid transparent;
          align-items: center;
          -ms-flex-align: center;
          -webkit-box-align: center;
          cursor: pointer;
          line-height: 20px;
          font-size: 16px;
          position: relative;
          font-weight: 500;
          flex-shrink: 0;
          -ms-flex-negative: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `
    );
    this.patchMessages();
    this.patchModal();

    this.dataManagerInterval = setInterval(() => {
      this.handleMessagesCap();
    }, 60 * 1000 * 5);

    this.ContextMenuActions = ZeresPluginLibrary.DiscordModules.ContextMenuActions;

    this.menu.randomValidChannel = (() => {
      const channels = this.ChannelStore.getChannels ? this.ChannelStore.getChannels() : ZeresPluginLibrary.WebpackModules.getByProps('getChannels').getChannels();
      var keys = Object.keys(channels);
      return channels[keys[(keys.length * Math.random()) << 0]];
    })();

    this.menu.userRequestQueue = [];

    this.menu.deleteKeyDown = false;
    document.addEventListener(
      'keydown',
      (this.keydownListener = e => {
        if (e.repeat) return;
        if (e.keyCode === 46) this.menu.deleteKeyDown = true;
      })
    );
    document.addEventListener(
      'keyup',
      (this.keyupListener = e => {
        if (e.repeat) return;
        if (e.keyCode === 46) this.menu.deleteKeyDown = false;
      })
    );

    this.menu.shownMessages = -1;
    const iconShit = ZeresPluginLibrary.WebpackModules.getByProps('container', 'children', 'toolbar', 'iconWrapper');
    this.channelLogButton = this.parseHTML(`<div tabindex="0" class="${iconShit.iconWrapper} ${iconShit.clickable}" role="button">
      <svg aria-hidden="true" class="${iconShit.icon}" name="Open Logs" viewBox="0 0 576 512">
        <path fill="currentColor" d="M218.17 424.14c-2.95-5.92-8.09-6.52-10.17-6.52s-7.22.59-10.02 6.19l-7.67 15.34c-6.37 12.78-25.03 11.37-29.48-2.09L144 386.59l-10.61 31.88c-5.89 17.66-22.38 29.53-41 29.53H80c-8.84 0-16-7.16-16-16s7.16-16 16-16h12.39c4.83 0 9.11-3.08 10.64-7.66l18.19-54.64c3.3-9.81 12.44-16.41 22.78-16.41s19.48 6.59 22.77 16.41l13.88 41.64c19.75-16.19 54.06-9.7 66 14.16 1.89 3.78 5.49 5.95 9.36 6.26v-82.12l128-127.09V160H248c-13.2 0-24-10.8-24-24V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24v-40l-128-.11c-16.12-.31-30.58-9.28-37.83-23.75zM384 121.9c0-6.3-2.5-12.4-7-16.9L279.1 7c-4.5-4.5-10.6-7-17-7H256v128h128v-6.1zm-96 225.06V416h68.99l161.68-162.78-67.88-67.88L288 346.96zm280.54-179.63l-31.87-31.87c-9.94-9.94-26.07-9.94-36.01 0l-27.25 27.25 67.88 67.88 27.25-27.25c9.95-9.94 9.95-26.07 0-36.01z"/>
      </svg>
    </div>`);
    this.channelLogButton.addEventListener('click', () => {
      this.openWindow();
    });
    this.channelLogButton.addEventListener('contextmenu', () => {
      if (!this.selectedChannel) return;
      this.menu.filter = `channel:${this.selectedChannel.id}`;
      this.openWindow();
    });
    new ZeresPluginLibrary.Tooltip(this.channelLogButton, 'Open Logs', { side: 'bottom' });

    if (this.settings.showOpenLogsButton) this.addOpenLogsButton();

    this.unpatches.push(
      this.Patcher.instead(ZeresPluginLibrary.DiscordModules.MessageActions, 'deleteMessage', (_, args, original) => {
        const messageId = args[1];
        if (this.messageRecord[messageId] && this.messageRecord[messageId].delete_data) return;
        this.localDeletes.push(messageId);
        if (this.localDeletes.length > 10) this.localDeletes.shift();
        return original(...args);
      })
    );

    this.unpatches.push(
      this.Patcher.instead(this.messageStore, 'getLastEditableMessage', (_this, [channelId]) => {
        const me = XenoLib.DiscordAPI.userId;
        return _this
          .getMessages(channelId)
          .toArray()
          .reverse()
          .find(iMessage => iMessage.author.id === me && iMessage.state === 'SENT' && (!this.messageRecord[iMessage.id] || !this.messageRecord[iMessage.id].delete_data));
      })
    );
    this.patchContextMenus();

    if (!(this.settings.flags & Flags.STARTUP_HELP)) {
      this.settings.flags |= Flags.STARTUP_HELP;
      this.showLoggerHelpModal(true);
      this.saveSettings();
    }

    this.selfTestInterval = setInterval(() => {
      this.selfTestTimeout = setTimeout(() => {
        if (this.selfTestFailures > 4) {
          clearInterval(this.selfTestInterval);
          this.selfTestInterval = 0;
          return BdApi.alert(`${this.getName()}: internal error.`, `Self test failure: Failed to hook dispatch. Recommended to reload your discord (CTRL + R) as the plugin may be in a broken state! If you still see this error, open up the devtools console (CTRL + SHIFT + I, click console tab) and report the errors to ${this.getAuthor()} for further assistance.`);
        }
        ZeresPluginLibrary.Logger.warn(this.getName(), 'Dispatch is not hooked, all our hooks may be invalid, attempting to reload self');
        this.selfTestFailures++;
        this.stop();
        this.start();
      }, 3000);
      this.dispatcher.dispatch({
        type: 'MESSAGE_LOGGER_V2_SELF_TEST'
      });
    }, 10000);

    if (this.selfTestInited) return;
    this.selfTestFailures = 0;
    this.selfTestInited = true;
  }
  initializeDailyHTMLLog() {
    const fs = this.nodeModules.fs;
    const path = this.nodeModules.path;
    const today = new Date().toISOString().split('T')[0]; // e.g., "2025-02-26"
    this.currentLogFile = path.join(this.pluginDir, `discord_log_${today}.html`);
    
    if (!fs.existsSync(this.currentLogFile)) {
      const initialHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #36393f; color: #dcddde; margin: 0; padding: 10px; }
              .message { margin: 10px 0; padding: 5px; display: flex; align-items: flex-start; }
              .avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; }
              .message-content { flex-grow: 1; }
              .username { font-weight: bold; color: #7289da; margin-right: 5px; }
              .timestamp { color: #72767d; font-size: 0.8em; }
              .content { word-wrap: break-word; }
              img, video { max-width: 300px; margin-top: 5px; }
            </style>
          </head>
          <body>
            <div id="chat-log">
              <!-- Messages will be appended here -->
            </div>
          </body>
        </html>
      `;
      fs.writeFileSync(this.currentLogFile, initialHTML);
    }
    
    // Check daily rollover
    this.checkDailyRollover();
  }
  checkDailyRollover() {
    const fs = this.nodeModules.fs;
    const path = this.nodeModules.path;
    const today = new Date().toISOString().split('T')[0];
    const newLogFile = path.join(this.pluginDir, `discord_log_${today}.html`);
    
    if (newLogFile !== this.currentLogFile) {
      this.currentLogFile = newLogFile;
      this.initializeDailyHTMLLog();
    }
    
    setTimeout(() => this.checkDailyRollover(), 60 * 1000); // Check every minute
  }
  logMessageToHTML(message) {
    const fs = this.nodeModules.fs;
    const timestamp = this.createTimeStamp(message.timestamp, true);
    const username = message.author.username;
    const content = message.content.replace(/[<>"&]/g, c => ({ "<": "<", ">": ">", "\"": "&quot;", "&": "&amp;" })[c]);
    const avatar = message.author.avatar ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=40` : '/assets/322c936a8c8be1b803cd94861bdfa868.png';
    
    let attachmentsHTML = '';
    if (message.attachments && message.attachments.length) {
      message.attachments.forEach(att => {
        if (this.isImage(att.url)) {
          attachmentsHTML += `<img src="${att.proxy_url}" alt="${att.filename}">`;
          if (this.settings.cacheAllImages) this.cacheImage(att.proxy_url, att.id, message.channel_id);
        } else if (att.url.match(/\.(mp4|webm)$/i)) {
          attachmentsHTML += `<video controls><source src="${att.proxy_url}" type="video/mp4"></video>`;
        } else {
          attachmentsHTML += `<a href="${att.proxy_url}">${att.filename}</a>`;
        }
      });
    }

    const messageHTML = `
      <div class="message">
        <img src="${avatar}" class="avatar" alt="${username}">
        <div class="message-content">
          <span class="username">${username}</span>
          <span class="timestamp">[${timestamp}]</span>
          <div class="content">${content}${attachmentsHTML}</div>
        </div>
      </div>
    `;

    fs.readFile(this.currentLogFile, 'utf8', (err, data) => {
      if (err) {
        ZeresPluginLibrary.Logger.err(this.getName(), 'Error reading HTML log file:', err);
        return;
      }
      const updatedHTML = data.replace('</div>\n  </body>', `${messageHTML}</div>\n  </body>`);
      fs.writeFile(this.currentLogFile, updatedHTML, err => {
        if (err) ZeresPluginLibrary.Logger.err(this.getName(), 'Error writing to HTML log file:', err);
      });
    });
  }
  cacheImage(url, attachmentId, channelId) {
    fetch(url)
      .then(res => {
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(ab => {
        const fileExtension = url.match(/(\.[0-9a-z]+)(?:$|\?)/i)[1];
        const cachePath = `${this.settings.imageCacheDir}/${attachmentId}${fileExtension}`;
        this.nodeModules.fs.writeFileSync(cachePath, Buffer.from(ab));
      })
      .catch(err => ZeresPluginLibrary.Logger.warn(this.getName(), `Failed to cache image ${attachmentId}:`, err));
  }
  shutdown() {
    if (!global.ZeresPluginLibrary) return;
    this.__started = false;
    const tryUnpatch = fn => {
      if (typeof fn !== 'function') return;
      try {
        fn();
      } catch (e) {
        ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Error unpatching', e);
      }
    };
    if (Array.isArray(this.unpatches)) for (let unpatch of this.unpatches) tryUnpatch(unpatch);
    ZeresPluginLibrary.Patcher.unpatchAll(this.getName());
    if (this.MessageContextMenuPatch) tryUnpatch(this.MessageContextMenuPatch);
    if (this.ChannelContextMenuPatch) tryUnpatch(this.ChannelContextMenuPatch);
    if (this.GuildContextMenuPatch) tryUnpatch(this.GuildContextMenuPatch);
    try {
      this.Patcher.unpatchAll();
    } catch (e) { }
    this.forceReloadMessages();
    if (this.style && this.style.css) ZeresPluginLibrary.PluginUtilities.removeStyle(this.style.css);
    if (this.dataManagerInterval) clearInterval(this.dataManagerInterval);
    if (this.selfTestInterval) clearInterval(this.selfTestInterval);
    if (this.selfTestTimeout) clearTimeout(this.selfTestTimeout);
    if (this._autoUpdateInterval) clearInterval(this._autoUpdateInterval);
    if (this.keydownListener) document.removeEventListener('keydown', this.keydownListener);
    if (this.keyupListener) document.removeEventListener('keyup', this.keyupListener);
    if (this.channelLogButton) this.channelLogButton.remove();
    if (this._imageCacheServer) this._imageCacheServer.stop();
    if (typeof this._modalsApiUnsubcribe === 'function')
      try {
        this._modalsApiUnsubcribe();
      } catch { }
    this.invalidateAllChannelCache();
  }
  automaticallyUpdate(tryProxy) {
    const updateFail = () => XenoLib.Notifications.warning(`[${this.getName()}] Unable to check for updates!`, { timeout: 7500 });
    new Promise(resolve => {
      const https = require('https');
      const req = https.get(tryProxy ? 'https://cors-anywhere.herokuapp.com/https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/MessageLoggerV2/MessageLoggerV2.plugin.js' : 'https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/MessageLoggerV2/MessageLoggerV2.plugin.js', { headers: { 'origin': 'discord.com' } }, res => {
        let body = '';
        res.on('data', chunk => ((body += new TextDecoder("utf-8").decode(chunk)), void 0));
        res.on('end', (rez) => {
          if (rez.statusCode !== 200) {
            if (!tryProxy) return this.automaticallyUpdate(true);
            updateFail();
            return;
          }
          if (!XenoLib.versionComparator(this.getVersion(), XenoLib.extractVersion(body))) return;
          const fs = require('fs');
          const _zerecantcode_path = require('path');
          const theActualFileNameZere = _zerecantcode_path.join(__dirname, _zerecantcode_path.basename(__filename));
          fs.writeFileSync(theActualFileNameZere, body);
          XenoLib.Notifications.success(`[${this.getName()}] Successfully updated!`, { timeout: 0 });
          BdApi.Plugins.reload(this.getName());
        });
      });
      req.on('error', _ => {
        if (!tryProxy) return this.automaticallyUpdate(true);
        updateFail();
      });
    });
  }
  observer({ addedNodes }) {
    let isChat = false;
    let isTitle = false;
    for (const change of addedNodes) {
      if ((isTitle = isChat = typeof change.className === 'string' && change.className.indexOf(this.observer.chatClass) !== -1) || (isChat = typeof change.className === 'string' && change.className.indexOf(this.observer.chatContentClass) !== -1) || (isTitle = typeof change.className === 'string' && change.className.indexOf(this.observer.titleClass) !== -1) || (change.style && change.style.cssText === 'border-radius: 2px; background-color: rgba(114, 137, 218, 0);') || (typeof change.className === 'string' && change.className.indexOf(this.observer.containerCozyClass) !== -1)) {
        try {
          if (isChat) {
            this.selectedChannel = this.getSelectedTextChannel();
            this.noTintIds = [];
            this.editModifiers = {};
          }
          if (!this.selectedChannel) return ZeresPluginLibrary.Logger.warn(this.getName(), 'Chat was loaded but no text channel is selected');
          if (isTitle && this.settings.showOpenLogsButton) {
            let srch = change.querySelector('div[class*="search_"]');
            if (!srch) return ZeresPluginLibrary.Logger.warn(this.getName(), 'Observer caught title loading, but no search bar was found! Open Logs button will not show!');
            if (this.channelLogButton && srch.parentElement) {
              srch.parentElement.insertBefore(this.channelLogButton, srch);
            }
            srch = null;
            if (!isChat) return;
          }
          const showStuff = (map, name) => {
            if (map[this.selectedChannel.id] && map[this.selectedChannel.id]) {
              if (this.settings.useNotificationsInstead) {
                XenoLib.Notifications.info(`There are ${map[this.selectedChannel.id]} new ${name} messages in ${this.selectedChannel.name && this.selectedChannel.type !== 3 ? '<#' + this.selectedChannel.id + '>' : 'DMs'}`, { timeout: 3000 });
              } else {
                this.showToast(`There are ${map[this.selectedChannel.id]} new ${name} messages in ${this.selectedChannel.name ? '#' + this.selectedChannel.name : 'DMs'}`, {
                  type: 'info',
                  onClick: () => this.openWindow(name),
                  timeout: 3000
                });
              }
              map[this.selectedChannel.id] = 0;
            }
          };
          if (this.settings.showDeletedCount) showStuff(this.deletedChatMessagesCount, 'deleted');
          if (this.settings.showEditedCount) showStuff(this.editedChatMessagesCount, 'edited');
        } catch (e) {
          ZeresPluginLibrary.Logger.stacktrace(this.getName(), 'Error in observer', e);
        }
        break;
      }
    }
  }
  buildSetting(data) {
    const { id } = data;
    const setting = XenoLib.buildSetting(data);
    if (id) setting.getElement().id = this.obfuscatedClass(id);
    return setting;
  }
  createSetting(data) {
    const current = Object.assign({}, data);
    if (!current.onChange) {
      current.onChange = value => {
        this.settings[current.id] = value;
        if (current.callback) current.callback(value);
      };
    }
    if (typeof current.value === 'undefined') current.value = this.settings[current.id];
    return this.buildSetting(current);
  }
  createGroup(group) {
    const { name, id, collapsible, shown, settings } = group;

    const list = [];
    for (let s = 0; s < settings.length; s++) list.push(this.createSetting(settings[s]));

    const settingGroup = new ZeresPluginLibrary.Settings.SettingGroup(name, { shown, collapsible }).append(...list);
    settingGroup.group.id = id;
    return settingGroup;
  }
  getSettingsPanel() {
    const list = [];
    list.push(
      this.createGroup({
        name: 'Ignores and overrides',
        id: this.obfuscatedClass('ml2-settings-ignores-overrides'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Ignore muted servers',
            id: 'ignoreMutedGuilds',
            type: 'switch'
          },
          {
            name: 'Ignore muted channels',
            id: 'ignoreMutedChannels',
            type: 'switch'
          },
          {
            name: 'Ignore bots',
            id: 'ignoreBots',
            type: 'switch'
          },
          {
            name: 'Ignore messages posted by you',
            id: 'ignoreSelf',
            type: 'switch'
          },
          {
            name: 'Ignore message edits from you',
            id: 'ignoreLocalEdits',
            type: 'switch'
          },
          {
            name: 'Ignore message deletes from you',
            note: 'Only ignores if you delete your own message.',
            id: 'ignoreLocalDeletes',
            type: 'switch'
          },
          {
            name: 'Ignore blocked users',
            id: 'ignoreBlockedUsers',
            type: 'switch'
          },
          {
            name: 'Ignore NSFW channels',
            id: 'ignoreNSFW',
            type: 'switch'
          },
          {
            name: 'Only log whitelist',
            id: 'onlyLogWhitelist',
            type: 'switch'
          },
          {
            name: 'Always log selected channel, regardless of whitelist/blacklist',
            id: 'alwaysLogSelected',
            type: 'switch'
          },
          {
            name: 'Always log DMs, regardless of whitelist/blacklist',
            id: 'alwaysLogDM',
            type: 'switch'
          },
          {
            name: 'Always log ghost pings, regardless of whitelist/blacklist',
            note: 'Messages sent in ignored/muted/blacklisted servers and channels will be logged and shown in sent, but only gets saved if a ghost ping occurs.',
            id: 'alwaysLogGhostPings',
            type: 'switch'
          }
        ]
      })
    );
    list.push(
      this.createGroup({
        name: 'Display settings',
        id: this.obfuscatedClass('ml2-settings-display'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Display dates with timestamps',
            id: 'displayDates',
            type: 'switch',
            callback: () => {
              if (this.selectedChannel) {
                this.invalidateAllChannelCache();
                this.cacheChannelMessages(this.selectedChannel.id);
              }
            }
          },
          {
            name: 'Display deleted messages in chat',
            id: 'showDeletedMessages',
            type: 'switch',
            callback: () => {
              this.invalidateAllChannelCache();
              if (this.selectedChannel) this.cacheChannelMessages(this.selectedChannel.id);
            }
          },
          {
            name: 'Display edited messages in chat',
            id: 'showEditedMessages',
            type: 'switch',
            callback: () => this.dispatcher.dispatch({ type: 'MLV2_FORCE_UPDATE_MESSAGE_CONTENT' })
          },
          {
            name: 'Max number of shown edits',
            id: 'maxShownEdits',
            type: 'textbox',
            onChange: val => {
              if (isNaN(val)) return this.showToast('Value must be a number!', { type: 'error' });
              this.settings.maxShownEdits = parseInt(val);
              this.dispatcher.dispatch({ type: 'MLV2_FORCE_UPDATE_MESSAGE_CONTENT' });
            }
          },
          {
            name: 'Show oldest edit instead of newest if over the shown edits limit',
            id: 'hideNewerEditsFirst',
            type: 'switch',
            callback: () => this.dispatcher.dispatch({ type: 'MLV2_FORCE_UPDATE_MESSAGE_CONTENT' })
          },
          {
            name: 'Use red background instead of red text for deleted messages',
            id: 'useAlternativeDeletedStyle',
            type: 'switch',
            callback: () => this.dispatcher.dispatch({ type: 'MLV2_FORCE_UPDATE_MESSAGE' })
          },
          {
            name: 'Display purged messages in chat',
            id: 'showPurgedMessages',
            type: 'switch',
            callback: () => {
              this.invalidateAllChannelCache();
              if (this.selectedChannel) this.cacheChannelMessages(this.selectedChannel.id);
            }
          },
          {
            name: 'Restore deleted messages after reload',
            id: 'restoreDeletedMessages',
            type: 'switch',
            callback: val => {
              if (val) {
                this.invalidateAllChannelCache();
                if (this.selectedChannel) this.cacheChannelMessages(this.selectedChannel.id);
              }
            }
          },
          {
            name: 'Show amount of new deleted messages when entering a channel',
            id: 'showDeletedCount',
            type: 'switch'
          },
          {
            name: 'Show amount of new edited messages when entering a channel',
            id: 'showEditedCount',
            type: 'switch'
          },
          {
            name: 'Display update notes',
            id: 'displayUpdateNotes',
            type: 'switch'
          },
          {
            name: 'Menu sort direction',
            id: 'reverseOrder',
            type: 'radio',
            options: [
              {
                name: 'New - old',
                value: false
              },
              {
                name: 'Old - new',
                value: true
              }
            ]
          },
          {
            name: 'Use XenoLib notifications instead of toasts',
            note: "This works for edit, send, delete and purge toasts, as well as delete and edit count toasts. Toggle it if you don't know what this does.",
            id: 'useNotificationsInstead',
            type: 'switch',
            callback: e => (e ? XenoLib.Notifications.success('Using Xenolib notifications', { timeout: 5000 }) : this.showToast('Using toasts', { type: 'success', timeout: 5000 }))
          }
        ]
      })
    );
    list.push(
      this.createGroup({
        name: 'Misc settings',
        id: this.obfuscatedClass('ml2-settings-misc'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Disable saving data. Logged messages are erased after reload/restart. Disables auto backup.',
            id: 'dontSaveData',
            type: 'switch',
            callback: val => {
              if (!val) this.saveData();
              if (!val && this.settings.autoBackup) this.saveBackup();
            }
          },
          {
            name: "Auto backup data (won't fully prevent losing data, just prevent total data loss)",
            id: 'autoBackup',
            type: 'switch',
            callback: val => {
              if (val && !this.settings.dontSaveData) this.saveBackup();
            }
          },
          {
            name: 'Aggresive message caching (makes sure we have the data of any deleted or edited messages)',
            id: 'aggresiveMessageCaching',
            type: 'switch'
          },
          {
            name: 'Cache all images by storing them locally in the MLV2_IMAGE_CACHE folder inside the plugins folder',
            id: 'cacheAllImages',
            type: 'switch'
          },
          {
            name: "Don't delete cached images",
            note: "If the message the image is from is erased from data, the cached image will be kept. You'll have to monitor disk usage on your own!",
            id: 'dontDeleteCachedImages',
            type: 'switch'
          },
          {
            name: 'Display open logs button next to the search box top right in channels',
            id: 'showOpenLogsButton',
            type: 'switch',
            callback: val => {
              if (val) return this.addOpenLogsButton();
              this.removeOpenLogsButton();
            }
          },
          {
            name: 'Block spam edit notifications (if enabled)',
            id: 'blockSpamEdit',
            type: 'switch'
          }
        ]
      })
    );
    list.push(
      this.createGroup({
        name: 'Toast notifications for guilds',
        id: this.obfuscatedClass('ml2-settings-toast-guilds'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Message sent',
            id: 'sent',
            type: 'switch',
            value: this.settings.toastToggles.sent,
            onChange: val => {
              this.settings.toastToggles.sent = val;
            }
          },
          {
            name: 'Message edited',
            id: 'edited',
            type: 'switch',
            value: this.settings.toastToggles.edited,
            onChange: val => {
              this.settings.toastToggles.edited = val;
            }
          },
          {
            name: 'Message deleted',
            id: 'deleted',
            type: 'switch',
            value: this.settings.toastToggles.deleted,
            onChange: val => {
              this.settings.toastToggles.deleted = val;
            }
          },
          {
            name: 'Ghost pings',
            id: 'ghostPings',
            type: 'switch',
            value: this.settings.toastToggles.ghostPings,
            onChange: val => {
              this.settings.toastToggles.ghostPings = val;
            }
          },
          {
            name: 'Disable toasts for local user (yourself)',
            id: 'disableToastsForLocal',
            type: 'switch',
            value: this.settings.toastToggles.disableToastsForLocal,
            onChange: val => {
              this.settings.toastToggles.disableToastsForLocal = val;
            }
          }
        ]
      })
    );

    list.push(
      this.createGroup({
        name: 'Toast notifications for DMs',
        id: this.obfuscatedClass('ml2-settings-toast-dms'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Message sent',
            id: 'sent',
            type: 'switch',
            value: this.settings.toastTogglesDMs.sent,
            onChange: val => {
              this.settings.toastTogglesDMs.sent = val;
            }
          },
          {
            name: 'Message edited',
            id: 'edited',
            type: 'switch',
            value: this.settings.toastTogglesDMs.edited,
            onChange: val => {
              this.settings.toastTogglesDMs.edited = val;
            }
          },
          {
            name: 'Message deleted',
            id: 'deleted',
            type: 'switch',
            value: this.settings.toastTogglesDMs.deleted,
            onChange: val => {
              this.settings.toastTogglesDMs.deleted = val;
            }
          },
          {
            name: 'Ghost pings',
            id: 'ghostPings',
            type: 'switch',
            value: this.settings.toastTogglesDMs.ghostPings,
            onChange: val => {
              this.settings.toastTogglesDMs.ghostPings = val;
            }
          }
        ]
      })
    );

    list.push(
      this.createGroup({
        name: 'Message caps',
        id: this.obfuscatedClass('ml2-settings-caps'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Cached messages cap',
            note: 'Max number of sent messages logger should keep track of in memory (HTML logs are unlimited)',
            id: 'messageCacheCap',
            type: 'textbox',
            onChange: val => {
              if (isNaN(val)) return this.showToast('Value must be a number!', { type: 'error' });
              this.settings.messageCacheCap = parseInt(val);
              clearInterval(this.dataManagerInterval);
              this.dataManagerInterval = setInterval(() => {
                this.handleMessagesCap();
              }, 60 * 1000 * 5);
            }
          },
          {
            name: 'Saved messages cap',
            note: "Max number of messages saved to disk, this limit is for deleted, edited and purged INDIVIDUALLY. So if you have it set to 1000, it'll be 1000 edits, 1000 deletes and 1000 purged messages max",
            id: 'savedMessagesCap',
            type: 'textbox',
            onChange: val => {
              if (isNaN(val)) return this.showToast('Value must be a number!', { type: 'error' });
              this.settings.savedMessagesCap = parseInt(val);
              clearInterval(this.dataManagerInterval);
              this.dataManagerInterval = setInterval(() => {
                this.handleMessagesCap();
              }, 60 * 1000 * 5);
            }
          },
          {
            name: 'Menu message render cap',
            note: 'How many messages will show before the LOAD MORE button will show',
            id: 'renderCap',
            type: 'textbox',
            onChange: val => {
              if (isNaN(val)) return this.showToast('Value must be a number!', { type: 'error' });
              this.settings.renderCap = parseInt(val);
              clearInterval(this.dataManagerInterval);
            }
          }
        ]
      })
    );

    list.push(
      this.createGroup({
        name: 'Advanced',
        id: this.obfuscatedClass('ml2-settings-advanced'),
        collapsible: true,
        shown: false,
        settings: [
          {
            name: 'Obfuscate CSS classes',
            note: 'Enable this if some plugin, library or theme is blocking you from using the plugin',
            id: 'obfuscateCSSClasses',
            type: 'switch'
          },
          {
            name: 'Automatic updates',
            note: "Do NOT disable unless you really don't want automatic updates",
            id: 'autoUpdate',
            type: 'switch',
            callback: val => {
              if (val) {
                this._autoUpdateInterval = setInterval(_ => this.automaticallyUpdate(), 1000 * 60 * 15);
                this.automaticallyUpdate();
              } else {
                clearInterval(this._autoUpdateInterval);
                try {
                  ZeresPluginLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), 'https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/MessageLoggerV2/MessageLoggerV2.plugin.js');
                } catch (err) { }
              }
            }
          },
          {
            name: 'Contextmenu submenu name',
            note: "Instead of saying Message Logger, make it say something else, so it's screenshot friendly",
            id: 'contextmenuSubmenuName',
            type: 'textbox'
          }
        ]
      })
    );

    const div = document.createElement('div');
    div.id = this.obfuscatedClass('ml2-settings-buttonbox');
    div.style.display = 'inline-flex';
    div.appendChild(this.createButton('Changelog', () => XenoLib.showChangelog(`${this.getName()} has been updated!`, this.getVersion(), this.getChanges())));
    div.appendChild(this.createButton('Stats', () => this.showStatsModal()));
    div.appendChild
