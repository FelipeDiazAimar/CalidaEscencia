import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function PATCH(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const supabase = getSupabaseClient();
    
    const body = await request.json();
    const { id } = context?.params || {};

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      return NextResponse.json({ error: 'Error updating announcement' }, { status: 500 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error in PATCH announcement API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
): Promise<NextResponse> {
  try {
    const supabase = getSupabaseClient();
    
    const { id } = context?.params || {};

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      return NextResponse.json({ error: 'Error deleting announcement' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE announcement API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}