// https://github.com/HackDavis/admissions-stuff/blob/main/filter_apps.ipynb
import type {Application} from 'app/_types/application'

export function normalizeEmail(email:string): string {
    return email.trim().toLowerCase();
}

export function removeDupEmail(applications: Application[]): Application[]{
    const seen = new Map<string, Application>();

    for (const app of applications){
        const key = normalizeEmail(app.email);
        
        if (!seen.has(key)){ // if seen before, don't add 
            seen.set(key, {...app, email:key});
        }
    }

    return Array.from(seen.values()); //return all unique apps by email
}

export function isEligibile(app:Application): boolean {
    if (app.age < 18){
        return false;
    }

    if (normalizeEmail(app.email).endsWith('.edu')){ // non .edu emails must explicitly be uc davis students
        if (!app.isUCDavisStudent){
            return false;
        }
    }
    return true
}

export function splitByEligibility(applications: Application[]): {eligible: Application[]; ineligible: Application[];} {
    const eligible: Application[] = [];
    const ineligible: Application[] = [];
  
    for (const app of applications) {
      if (isEligibile(app)) {
        eligible.push(app);
      } else {
        ineligible.push(app);
      }
    }
  
    return { eligible, ineligible };
  }
/*
questions:
1. batches? it looks like in jupyter notebook they specifically handled 3 batches. are we doing batches on a rolling basis or is there always going to be just 3 batches?
2. do we want to stick with the current logic? i modeled this after the logic in the notebook, but did we want to accept 17 and younger if they were uc davis students or in college?
3. in what cases does someone end up as waitlisted? does it got apply -> waitlisted -> accept/reject always or do some people go apply -> accept/reject
*/
