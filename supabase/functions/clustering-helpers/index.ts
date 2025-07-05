
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { functionName, args } = await req.json()
    console.log(`Executing clustering function: ${functionName}`, args)

    let result
    switch (functionName) {
      case 'get_clusters_with_embeddings':
        const { data: clusters, error: clustersError } = await supabaseClient
          .rpc('get_clusters_with_embeddings')
        
        if (clustersError) {
          console.error('Error fetching clusters:', clustersError)
          result = { data: [], error: clustersError }
        } else {
          result = { data: clusters || [], error: null }
        }
        break
        
      case 'create_article_cluster':
        const { data: newCluster, error: createError } = await supabaseClient
          .rpc('create_article_cluster', {
            cluster_name: args.cluster_name,
            cluster_description: args.cluster_description,
            centroid_data: args.centroid_data
          })
        
        if (createError) {
          console.error('Error creating cluster:', createError)
          result = { data: null, error: createError }
        } else {
          console.log('Created new cluster:', newCluster)
          result = { data: { id: newCluster[0]?.id }, error: null }
        }
        break
        
      case 'update_article_features':
        const { error: updateError } = await supabaseClient
          .rpc('update_article_features', {
            article_id: args.article_id,
            entities_data: args.entities_data,
            keywords_data: args.keywords_data,
            embedding_data: args.embedding_data,
            cluster_id_data: args.cluster_id_data
          })
        
        if (updateError) {
          console.error('Error updating article features:', updateError)
          result = { data: null, error: updateError }
        } else {
          console.log(`Updated article ${args.article_id} with clustering features`)
          result = { data: null, error: null }
        }
        break
        
      case 'get_article_cluster':
        const { data: articleCluster, error: articleError } = await supabaseClient
          .rpc('get_article_cluster', {
            article_id: args.article_id
          })
        
        if (articleError) {
          console.error('Error fetching article cluster:', articleError)
          result = { data: null, error: articleError }
        } else {
          result = { data: articleCluster[0] || null, error: null }
        }
        break
        
      case 'get_clustered_articles':
        const { data: clusteredArticles, error: articlesError } = await supabaseClient
          .rpc('get_clustered_articles', {
            cluster_id: args.cluster_id,
            exclude_id: args.exclude_id,
            article_limit: args.article_limit
          })
        
        if (articlesError) {
          console.error('Error fetching clustered articles:', articlesError)
          result = { data: [], error: articlesError }
        } else {
          result = { data: clusteredArticles || [], error: null }
        }
        break
        
      default:
        result = { data: null, error: { code: '42883', message: 'Function not found' } }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Clustering helpers error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
