// API Route: DELETE /api/trips/[id]
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // In a real app, delete from database
  return NextResponse.json({ success: true, id });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ id, message: 'Use localStorage for single trip retrieval' });
}
