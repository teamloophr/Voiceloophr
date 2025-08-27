type Json = Record<string, any>

function getAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
}

export async function auditLog(entry: {
  userId?: string | null
  action: string
  resourceType?: string
  resourceId?: string
  metadata?: Json
}) {
  try {
    const admin = getAdminClient()
    if (!admin) return
    await admin.from('audit_logs').insert({
      user_id: entry.userId || null,
      action: entry.action,
      resource_type: entry.resourceType || null,
      resource_id: entry.resourceId || null,
      metadata: entry.metadata || {}
    })
  } catch (e) {
    try { console.warn('[audit] failed to write audit log', e) } catch {}
  }
}



