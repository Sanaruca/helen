export class WSSMessage<Data = object> {
  type: string;
  data: Data;

  constructor(type: string, data: Data) {
    this.type = type;
    this.data = data;
  }

  static stringify<T extends object>(type: string, data: T) {
    return JSON.stringify(new WSSMessage(type, data));
  }

  static parse<Data extends object = object>(
    message: string
  ): WSSMessage<Data> {
    const obj = JSON.parse(message);

    if (!obj.type || !obj.type) throw new Error("invalid WSSMessage");

    return obj;
  }
}
