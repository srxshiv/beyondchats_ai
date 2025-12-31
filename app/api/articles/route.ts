import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Article from '@/models/Article';

const MONGODB_URI = process.env.MONGODB_URI || '';

export async function GET() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const articles = await Article.find({}).sort({ _id: -1 });

    return NextResponse.json({ success: true, data: articles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}