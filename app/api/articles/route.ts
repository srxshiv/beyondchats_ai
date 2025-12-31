import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Article from '@/models/Article'; // We import the model we created earlier

const MONGODB_URI = process.env.MONGODB_URI || '';

export async function GET() {
  try {
    // 1. Connect to DB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    // 2. Fetch all articles, sorted by newest scrape first
    // We lean on the model we defined in src/models/Article.ts
    const articles = await Article.find({}).sort({ _id: -1 });

    return NextResponse.json({ success: true, data: articles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}