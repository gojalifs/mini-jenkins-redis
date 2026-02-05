import express from 'express';

/**
 * Webhook endpoint triggered by git post-receive hook
 * Receives: { repo, commit, ref }
 */
export async function handleWebhook(req, res) {
  const { repo, commit, ref } = req.body;
  
  console.log(`Webhook received: ${repo} @ ${commit} (${ref})`);
  
  // TODO: Enqueue build job
  // const buildId = await enqueueBuild({ repo, commit, ref });
  
  res.json({ 
    success: true, 
    message: 'Build enqueued',
    // buildId 
  });
}
