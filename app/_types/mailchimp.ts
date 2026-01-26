export interface Mailchimp {
  _id: string;
  batchNumber: number;
  apiCallsMade: number;
  maxApiCalls: number;
  apiKeyIndex: number;
  lastUpdate: Date;
  lastReset: Date;
}
