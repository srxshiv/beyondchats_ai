import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  url: string;
  content: string;
  date?: string;
  originalContent: string;
  isUpdated: boolean;
  references?: Array<{ title: string; link: string }>;
}

const ArticleSchema: Schema = new Schema({
  title: { type: String, required: true },
  url: { type: String, required: true, unique: true }, 
  content: { type: String, required: true },
  date: { type: String },
  originalContent: { type: String },
  isUpdated: { type: Boolean, default: false },
  references: [{ title: String, link: String }]
});

const Article: Model<IArticle> = mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;