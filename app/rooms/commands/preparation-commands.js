const Command = require('@colyseus/command').Command;
const uniqid = require('uniqid');
const User = require('../../models/user');
const BOT_AVATAR = require('../../models/enum').BOT_AVATAR;

class OnJoinCommand extends Command {
  execute({client, options, auth}) {
    this.state.users[client.sessionId] = new User(client.sessionId, auth.email.slice(0, auth.email.indexOf('@')), auth.metadata.avatar, false, false);
    this.room.broadcast('messages', {'name':'Server', 'message':`${ auth.email } joined.`});
    if(Object.keys(this.state.users).length > 8){
      return [new OnRemoveBotCommand()];
    }
  }
}

class OnGameStartCommand extends Command {
  execute({client, message}) {
    let allUsersReady = true;
    for (const id in this.state.users) {
      if (!this.state.users[id].ready) {
        allUsersReady = false;
      }
    }
    if (allUsersReady) {
      this.room.broadcast('game-start', message, {except: client});
    }
  }
}

class OnMessageCommand extends Command {
  execute({client, message}) {
    this.room.broadcast('messages', message);
  }
}

class OnLeaveCommand extends Command {
  execute({client, consented}) {
    this.room.broadcast('messages', {'name':'Server', 'message':`${ this.state.users[client.id].name } left.`});
    delete this.state.users[''+client.id];
  }
}

class OnToggleReadyCommand extends Command {
  execute(client) {
    this.state.users[client.id].ready = !this.state.users[client.id].ready;
  }
}

class OnAddBotCommand extends Command {
  execute(client) {
    if(Object.keys(this.state.users).length < 8){
      let id = uniqid();
      let botList = Object.keys(BOT_AVATAR);
      let bot = botList[Math.floor(Math.random() * botList.length)];
      this.state.users[id] = new User(id, `BOT ${BOT_AVATAR[bot]}`, BOT_AVATAR[bot], true, true);
      this.room.broadcast('messages', {'name':'Server', 'message':`Bot ${ BOT_AVATAR[bot] } added.`});
    }
  }
}

class OnRemoveBotCommand extends Command {
  execute(client) {
    for (const id in this.state.users) {
      if(this.state.users[id].isBot){
        delete this.state.users[id];
        this.room.broadcast('messages', {'name':'Server', 'message':`Bot removed.`});
        break;
      }
    }
  }
}

module.exports = {
  OnJoinCommand: OnJoinCommand,
  OnGameStartCommand: OnGameStartCommand,
  OnLeaveCommand: OnLeaveCommand,
  OnToggleReadyCommand: OnToggleReadyCommand,
  OnMessageCommand: OnMessageCommand,
  OnAddBotCommand: OnAddBotCommand,
  OnRemoveBotCommand: OnRemoveBotCommand
};
