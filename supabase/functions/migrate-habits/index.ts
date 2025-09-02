import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action } = await req.json()

    if (action === 'migrate') {
      console.log('Starting historical habits migration...')
      
      // Call the migration function
      const { error } = await supabase.rpc('migrate_historical_habits_to_snapshots')
      
      if (error) {
        console.error('Migration error:', error)
        throw error
      }
      
      console.log('Migration completed successfully')
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Historical habits migrated to snapshots successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'daily_snapshot') {
      console.log('Creating daily snapshot...')
      
      // Call the daily snapshot function
      const { error } = await supabase.rpc('create_daily_habit_snapshot')
      
      if (error) {
        console.error('Daily snapshot error:', error)
        throw error
      }
      
      console.log('Daily snapshot created successfully')
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Daily snapshot created successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'cleanup') {
      console.log('Cleaning up old habit completions...')
      
      // Call the cleanup function
      const { error } = await supabase.rpc('cleanup_old_habit_completions')
      
      if (error) {
        console.error('Cleanup error:', error)
        throw error
      }
      
      console.log('Cleanup completed successfully')
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Old habit completions cleaned up successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid action. Use "migrate", "daily_snapshot", or "cleanup"' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})