import { NextResponse } from 'next/server';

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function failure(message: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json({ data: null, error: { message, details } }, { status });
}
