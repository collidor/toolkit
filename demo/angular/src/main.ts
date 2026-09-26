import { bootstrapApplication } from "@angular/platform-browser";
import { provideExperimentalZonelessChangeDetection } from "@angular/core";
import { APP_BASE_HREF } from "@angular/common";
import { AppComponent } from "./app/app.component";

bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    {
      provide: APP_BASE_HREF,
      useValue: "./",
    },
  ],
}).catch((err) => console.error("Angular bootstrap failed:", err));
