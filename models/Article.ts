import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Define the TypeScript Interface
export interface IArticle extends Document {
  title: string;
  url: string;
  content: string;
  date?: string;
  originalContent: string;
  isUpdated: boolean;
  references?: Array<{ title: string; link: string }>;
}

// 2. Define the Mongoose Schema
const ArticleSchema: Schema = new Schema({
  title: { type: String, required: true },
  url: { type: String, required: true, unique: true }, // URL must be unique
  content: { type: String, required: true },
  date: { type: String },
  originalContent: { type: String }, // Backup of original text
  isUpdated: { type: Boolean, default: false },
  references: [{ title: String, link: String }]
});

// 3. Export the Model
// Note: We check mongoose.models to prevent "OverwriteModelError" in Next.js later
const Article: Model<IArticle> = mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;