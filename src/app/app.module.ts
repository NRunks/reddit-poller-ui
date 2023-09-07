import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RoutingModule } from './routing.module';
import { RedditTokenAuthInterceptor } from './token-interceptor';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule, HttpClientModule, RoutingModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: RedditTokenAuthInterceptor, multi: true },],
  bootstrap: [AppComponent]
})
export class AppModule { }
