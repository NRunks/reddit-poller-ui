import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { RedditService } from './reddit.service'
import { environment } from '../environments/environment';

@Injectable()
export class RedditTokenAuthInterceptor implements HttpInterceptor {
  constructor(private _reddit: RedditService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = JSON.parse(localStorage.getItem("auth_token") || "{}");
    const isApiUrl = request.url.startsWith(environment.apiURL) || request.url.startsWith(environment.apiURL_Subreddit);
    if (token && token.access_token) {
      request = request.clone({
        setHeaders: {
          Authorization: `bearer ${token.access_token}`
        }
      });
    }

    return next.handle(request).pipe(catchError(err => {
      if ([401, 403].includes(err.status)) {
        this._reddit.RefreshToken().subscribe((token) => {
          request = request.clone({
            setHeaders: {
              Authorization: `bearer ${token}`
            }
          });
          return next.handle(request);
        }, (err) => {
          let state = this.randomString(16)
          localStorage.setItem("state", state)
          const params: string =
            `client_id=${environment.clientID}&response_type=code&state=${state}&redirect_uri=${environment.redirectURI}&duration=permanent&scope=identity%20read`;
          window.location.href = `${environment.apiURL}authorize?${params}`
        })
        // auto logout if 401 response returned from api
      }

      const error = err.error.message || err.statusText;
      return throwError(() => error);
    }));
  }

  private randomString(length: number) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return result;
  }
}
