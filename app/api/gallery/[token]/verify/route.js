import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request, { params }) {
  try {
    const { password } = await request.json()
    const { token } = await params
    
    // Get gallery with password
    const { data, error } = await supabaseAdmin
      .from('galleries')
      .select('passwordhash, allow_download')
      .eq('id', token)
      .single()
    
    if (error || !data) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, data.passwordhash)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
    
    // Return session token
    return NextResponse.json({ 
      session: `session_${Date.now()}_${Math.random().toString(36)}`,
      allow_download: data.allow_download !== false
    })
  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
