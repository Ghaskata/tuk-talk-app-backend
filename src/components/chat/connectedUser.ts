export class ConnectedUser {
  constructor(id: string, soc_id: string) {
    this.id = id;
    this.socket_id = soc_id;
  }
  id: string;
  socket_id: string;
}
