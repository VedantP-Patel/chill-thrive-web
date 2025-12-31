import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Notification system disabled
  return NextResponse.json({ status: 'disabled' });
}