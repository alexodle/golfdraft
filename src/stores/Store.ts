import {EventEmitter} from 'events';

export default class Store extends EventEmitter {

  changeEvent(): string {
    throw Error("Not implemented");
  }

  emitChange() {
    this.emit(this.changeEvent());
  }

  addChangeListener(callback: () => void) {
    this.on(this.changeEvent(), callback);
  }

  removeChangeListener(callback: () => void) {
    this.removeListener(this.changeEvent(), callback);
  }

};
