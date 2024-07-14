export class ConnectedUser {
  map(arg0: (v: any) => void) {
    throw new Error("Method not implemented.");
  }
  constructor(id: string, soc_id: string) {
    this.id = id;
    this.socket_id = soc_id;
  }
  id: string;
  socket_id: string;
}
