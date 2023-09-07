import { Injectable } from '@angular/core';
import * as signalR from "@microsoft/signalr"
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection!: signalR.HubConnection;
  private messageSource: Subject<boolean> = new Subject<boolean>();
  currentPoll = this.messageSource.asObservable();

  constructor() { }
  public startConnection = () => {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7292/Poll', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .build();
    this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err))
  }

  public addPollListner = () => {
    this.hubConnection.on('SendMessage', (notification: Notification) => {
      console.log(notification)
      this.messageSource.next(true)
    });
  }
}
