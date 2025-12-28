import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable({ providedIn: 'root' })
export class PendingChangesGuard
  implements CanDeactivate<ComponentCanDeactivate>
{
  canDeactivate(
    component: ComponentCanDeactivate
  ): Observable<boolean> | boolean {
    // If the component has a canDeactivate method, call it
    // Otherwise, allow navigation
    return component.canDeactivate ? component.canDeactivate() : true;
  }
}
