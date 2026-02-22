import { NextResponse } from 'next/server';
import { writeFileSync } from 'fs';

export async function POST(request: Request) {
  try {
    const { path, content } = await request.json();
    
    if (!path || content === undefined) {
      return NextResponse.json({ error: 'Path and content required' }, { status: 400 });
    }
    
    // Security check: only allow editing in openclaw directories
    if (!path.includes('.openclaw')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }
    
    writeFileSync(path, content, 'utf-8');
    
    return NextResponse.json({ success: true, message: 'File saved successfully' });
  } catch (error: any) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
