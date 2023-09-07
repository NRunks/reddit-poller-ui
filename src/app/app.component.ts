import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnChanges, OnInit, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { RedditService } from './reddit.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from './../environments/environment';
import { mergeMap, switchMap } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject, forkJoin, of } from 'rxjs';
import { SignalrService } from './signalr.service';
import * as $ from 'jquery';
import { Toast } from 'bootstrap';




@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit{
  private code: string = "";
  subreddits: any[] = [];
  topPosts: any[][] = [[]]
  subReddits$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([])
  subRedditsObservable$: Observable<any[]> = null;
  @ViewChildren('default') defaultButton: QueryList<ElementRef> = new QueryList<ElementRef>()
  @ViewChild('errorToast', { static: true }) toastEl: any;
  toast: any;
  selectedIndex: number = 0;
  httpErr$: Subject<boolean> = new Subject<boolean>()
  errorMessage: string = "";

  constructor(private _route: ActivatedRoute, private _reddit: RedditService, private _signalrService: SignalrService) {
    /*this._reddit.Authorize().subscribe((token: any) => {
      console.log(token)
    }, (error) => {
      console.log(error)
    })*/
  }

  ngOnInit() {
    this._route.queryParams
      .subscribe(params => {
        console.log(params); // { orderby: "price" }
        this.code = params['code'];
        console.log(this.code);
        console.log(params['state'])
        if (this.code && localStorage.getItem("state") == params['state']) {
          this._reddit.Authorize(this.code).pipe(switchMap((token: any) => {
            console.log(token)
            localStorage.setItem("auth_token", JSON.stringify(token))
            return of(token)
          }), switchMap((token: any) => {
            return this._reddit.MostPopular()
          })).subscribe((popularList) => {
            console.log(popularList)
            this.subreddits = popularList.data.children
            this.subReddits$.next(this.subreddits);
            this._signalrService.startConnection();
            this._signalrService.addPollListner()
            this._signalrService.currentPoll.subscribe(() => {
              const httpCalls = [];
              for (let i = 0; i < this.subreddits.length; i++) {
                if (this.selectedIndex == 0) {
                  httpCalls.push(this._reddit.TopPosts(popularList.data.children[i].data.display_name))
                } else {
                  httpCalls.push(this._reddit.NewestPosts(popularList.data.children[i].data.display_name))
                }
              }
              forkJoin(httpCalls).subscribe(res => {
                console.log('res', res);
                this.httpErr$.next(false)
                this.topPosts = [];
                this.topPosts = res
                let active = document.querySelector('button.active') ? document.querySelector('button.active') : this.defaultButton.first;
                this.onButtonGroupClick({ target: active, srcElement: active })
              }, (err) => {
                this.httpErr$.next(true)
                this.toast = new Toast(this.toastEl.nativeElement, {})
                this.toast.show()
              });
            })
            console.log(popularList)
          }, (error) => {
            console.error(error)
            this.errorMessage = error;
            this.toast = new Toast(this.toastEl.nativeElement, {})
            this.toast.show()
          })
        }
      })
  }

  public ngAfterViewInit() {
    this.subRedditsObservable$ = this.subReddits$.asObservable()
    this.subRedditsObservable$.subscribe((subreddits) => {
      const httpCalls = [];
      for (let i = 0; i < subreddits.length; i++) {
        httpCalls.push(this._reddit.TopPosts(subreddits[i].data.display_name))
      }
      forkJoin(httpCalls).subscribe(res => {
        console.log('res', res);
        this.topPosts = [];
        this.topPosts = res
        this.httpErr$.next(false)
        console.log("top posts", this.topPosts)
        this.onButtonGroupClick({ target: this.defaultButton.first, srcElement: this.defaultButton.first })
      }, (err) => {
        console.error(err)
        this.httpErr$.next(true)
        this.errorMessage = err;
        this.toast = new Toast(this.toastEl.nativeElement, {})
        this.toast.show()
      });
    })
  }
      
  Authorize() {
    const token = JSON.parse(localStorage.getItem("auth_token") || "{}");
    if (!token || !token.access_token) {
      let state = this.randomString(16)
      localStorage.setItem("state", state)
      const params: string =
        `client_id=${environment.clientID}&response_type=code&state=${state}&redirect_uri=${environment.redirectURI}&duration=permanent&scope=identity%20read`;
      window.location.href = `${environment.apiURL}authorize?${params}`
    } else {
      this._reddit.MostPopular().pipe(mergeMap((popularList) => {
        this.subreddits = popularList.data.children;
        this.subReddits$.next(this.subreddits);
        console.log(popularList)
        return of(popularList);
      }), mergeMap((popularList) => {
        this._signalrService.startConnection();
        this._signalrService.addPollListner()
        this._signalrService.currentPoll.subscribe(() => {
          const httpCalls = [];
          for (let i = 0; i < this.subreddits.length; i++) {
            if (this.selectedIndex = 0) {
              httpCalls.push(this._reddit.TopPosts(popularList.data.children[i].data.display_name))
            } else {
              httpCalls.push(this._reddit.NewestPosts(popularList.data.children[i].data.display_name))
            }
          }
          forkJoin(httpCalls).subscribe(res => {
            console.log('res', res);
            this.topPosts = [];
            this.topPosts = res
            this.httpErr$.next(false)
            let active = document.querySelector('button.active') ? document.querySelector('button.active') : this.defaultButton.first;
            this.onButtonGroupClick({ target: active, srcElement: active })
          }, (err) => {
            console.error(err)
            this.toast = new Toast(this.toastEl.nativeElement, {})
            this.toast.show()
            this.httpErr$.next(true)
          });
        })
        return of(popularList)
      })).subscribe(() => {
      }, (error: string) => {
        console.error(error)
        this.errorMessage = error;
        this.toast = new Toast(this.toastEl.nativeElement, {})
        this.toast.show()
      })
    }
  }

  onButtonGroupClick($event: { target: any; srcElement: any; }, index?: number) {
    let clickedElement = $event.target || $event.srcElement;

    if (clickedElement.nodeName === "BUTTON" || (clickedElement.nativeElement && (clickedElement.nativeElement.nodeName === "BUTTON"))) {

      let isCertainButtonAlreadyActive = (clickedElement.parentElement && clickedElement.parentElement.querySelector(".active")) ?
        (clickedElement.parentElement && clickedElement.parentElement.querySelector(".active")) :
        (clickedElement.nativeElement && clickedElement.nativeElement.parentElement && clickedElement.nativeElement.parentElement.querySelector(".active"));
      // if a Button already has Class: .active
      if (isCertainButtonAlreadyActive) {
        isCertainButtonAlreadyActive.classList.remove("active");
      }

      clickedElement.nativeElement ? clickedElement.nativeElement.className += " active" : clickedElement.className += " active";

        if ((clickedElement.nativeElement && clickedElement.nativeElement.innerHTML == "Trending") || clickedElement.innerHTML == "Trending") {
          const httpCalls = [];
          for (let i = 0; i < this.subreddits.length; i++) {
            httpCalls.push(this._reddit.TopPosts(this.subreddits[i].data.display_name))
          }
          this.selectedIndex = 0;
          forkJoin(httpCalls).subscribe(res => {
            console.log('res', res);
            this.topPosts = [];
            this.topPosts = res
            this.httpErr$.next(false)
            console.log("top posts", this.topPosts)
          }, (err) => {
            this.httpErr$.next(true)
            this.errorMessage = err
            this.toast = new Toast(this.toastEl.nativeElement, {})
            this.toast.show()
          });
        }
        if ((clickedElement.nativeElement && clickedElement.nativeElement.innerHTML == "New") || clickedElement.innerHTML == "New") {
          const httpCalls = [];
          for (let i = 0; i < this.subreddits.length; i++) {
            httpCalls.push(this._reddit.NewestPosts(this.subreddits[i].data.display_name))
          }
          this.selectedIndex = 1;
          forkJoin(httpCalls).subscribe(res => {
            console.log('res', res);
            this.topPosts = [];
            this.topPosts = res
            this.httpErr$.next(false)
            console.log("new posts", this.topPosts)
          }, (err) => {
            this.httpErr$.next(true)
            this.errorMessage = err;
            this.toast = new Toast(this.toastEl.nativeElement, {})
            this.toast.show()
          });
        }
    }

  }


  IsAuthorized() {
    return localStorage.getItem("refresh_token") ? true : false;
  }

  private randomString(length: number) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return result;
  }

  title = 'Reddit Poller'
}

