import { NextResponse } from "next/server";

// Basic REST surface for tasks: list, create, update.
export async function GET() {
  // TODO: Fetch tasks per user context using lib/tasks services and Supabase DB helpers.
  return NextResponse.json({ tasks: [] });
}

export async function POST(request: Request) {
  const payload = await request.json();
  // TODO: Validate and create orchestrator tasks via lib/tasks/taskService.ts.
  return NextResponse.json({ created: true, payload });
}
