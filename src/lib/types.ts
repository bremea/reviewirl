import * as Mongo from 'mongodb';

export interface quType {
  question: string;
  answers: Array<{ label: string; correct?: boolean }>;
  image?: string;
}
export interface setType extends Mongo.WithId<Mongo.Document> {
  kId: string;
  questions: Array<quType>;
}
export type Markers = Array<{
  location: [number, number];
  team: TeamValues;
}>;
export type TeamValues = 'blue' | 'red' | 'none';
