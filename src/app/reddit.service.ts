import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/internal/operators/map';
import { environment } from './../environments/environment';
import { of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RedditService {
  constructor(private _http: HttpClient) { }

  Authorize(code: string): Observable<any> {
    const token = JSON.parse(localStorage.getItem("auth_token") || "{}");
    if (token && token.access_token) {
      return of(token)
    } else {
      const headers = new HttpHeaders().set('Authorization', 'Basic ' + btoa(environment.clientID + ':' + environment.clientSecret)).set('Content-Type', 'application/x-www-form-urlencoded')
      return this._http.post<any>(environment.apiURL + "access_token", "grant_type=authorization_code&code=" + code + "&redirect_uri=" + environment.redirectURI, { 'headers': headers });
    }
  }

  RefreshToken(): Observable<any> {
    const token = JSON.parse(localStorage.getItem("refresh_token") || "{}");
    if (token && token.refresh_token) {
      const headers = new HttpHeaders().set('Authorization', 'Basic ' + btoa(environment.clientID + ':' + environment.clientSecret)).set('Content-Type', 'application/x-www-form-urlencoded')
      return this._http.post<any>(environment.apiURL + "access_token", "grant_type=refresh_token&refresh_token=" + token.refresh_token, { 'headers': headers });
    } else {
      if (localStorage.getItem("auth_token")) { localStorage.removeItem("auth_token") }
      throw throwError("invalid_token_cache")
    }
  }

  MostPopular(): Observable<any> {
    return this._http.get<any>(environment.apiURL_Subreddit + "popular.json?raw_json=1&limit=10");
  }

  TopPosts(subreddit: string): Observable<any> {
    return this._http.get<any>("https://oauth.reddit.com/r/" + subreddit +  "/top?count=1&raw_json=1&limit=5");
  }

  NewestPosts(subreddit: string): Observable<any> {
    return this._http.get<any>("https://oauth.reddit.com/r/" + subreddit + "/new?raw_json=1&limit=10");
  }
}
