import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = "https://nsibvnnljsqaavlwsjxx.supabase.co"
const supabaseApiKey = process.env.SUPABASE_API_KEY!

export const supabase = createClient(supabaseUrl, supabaseApiKey)

export async function checkConnection() {
  const { error } = await supabase
    .from("workflows")
    .select("id")
    .limit(1);

  if (error) {
    console.error("❌ Supabase connection failed:", error.message);
  } else {
    console.log("✅ Supabase connection is working.");
  }
}

export async function isUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  return !!data && !error
}

export async function createUser(user: {
  id: string
  email: string
  name: string
}) {
  const exists = await isUser(user.id)
  if (exists) return

  await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    name: user.name
  })
}

export async function createProposal(userId: string, name: string) {
    const id = uuidv4()

    const { error } = await supabase.from('proposals').insert({
    id,
    user_id: userId,
    name: name ?? null
    })

    if (error) throw new Error('Failed to create proposal')

    redirect(`/p/${id}`)
}

export async function getProposalsByUserId(userId: string) {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  
    if (error) throw new Error(`Failed to fetch proposals: ${error.message}`)
    return data
}
  
export async function createChat(userId: string, name?: string) {
  const id = uuidv4()

  const { error } = await supabase.from('chats').insert({
      id,
      user_id: userId,
      name: name ?? null
  })

  if (error) throw new Error('Failed to create chat')

  return id
}

export async function updateChat(chatId: string, newName: string) {
  const { data, error } = await supabase
    .from('chats')
    .update({ name: newName })
    .eq('id', chatId)

  if (error) {
    throw new Error(`Failed to update chat name: ${error.message}`)
  }
  return data
}

export async function deleteChat(chatId: string) {
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId);

  return { error };
}

export async function getChatsByUserId(userId: string) {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  
    if (error) throw new Error(`Failed to fetch proposals: ${error.message}`)
    return data
}

export async function isUserOwner(type: "chats" | "proposal", id: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(type)
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  return data !== null
}

export async function addTranscript({
    sourceType,
    sourceId,
    content,
    system = false
  }: {
    sourceType: 'chat' | 'proposal'
    sourceId: string
    content: string
    system?: boolean
  }) {
    const { error } = await supabase.from('transcripts').insert({
      source_type: sourceType,
      source_id: sourceId,
      content,
      system
    })
  
    if (error) throw new Error(`Failed to add ${sourceType} transcript: ${error.message}`)
}

export async function getTranscriptsBySourceId(sourceType: 'chat' | 'proposal', sourceId: string) {
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .order('created_at', { ascending: true })
  
    if (error) throw new Error(`Failed to fetch ${sourceType} transcripts: ${error.message}`)
    return data
}  

export async function createTranscript({
    sourceType,
    sourceId,
    content,
    system = false
}: {
    sourceType: 'chat' | 'proposal'
    sourceId: string
    content: string
    system?: boolean
}) {
    const { error } = await supabase.from('transcripts').insert({
      source_type: sourceType,
      source_id: sourceId,
      content,
      system
    })
  
    if (error) throw new Error(`Failed to create transcript: ${error.message}`)
}

export interface CreateWorkflowInput {
  source_type: 'chat' | 'proposal';
  source_id: string;
  state?: 'paused' | 'running';
  edges?: object;
}

export async function createWorkflow(input: CreateWorkflowInput) {
  const { data, error } = await supabase
    .from('workflows')
    .insert([
      {
        source_type: input.source_type,
        source_id: input.source_id,
        state: input.state ?? 'paused',
        edges: input.edges ?? {},
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export interface CreateAgentInput {
  workflow_id: string;
  type:
    | 'computerUse'
    | 'webSearch'
    | 'documentation'
    | 'email'
    | 'spreadsheet'
    | 'voice'
    | 'trigger';
  label?: string;
  instance_id?: string;
  name?: string;
  status: 'success' | 'running' | 'intervention' | 'pending';
  prompt?: string;
  model?: string;
  cronjob?: string;
  file_ids?: string[];
  feedback?: object;
  progress?: number;
  summary?: string;
  last_run?: string;
  failure_reason?: string;
  payload?: object;
}

export async function addAgent(input: CreateAgentInput) {
  const { data, error } = await supabase
    .from('agents')
    .insert([
      {
        workflow_id: input.workflow_id,
        type: input.type,
        label: input.label,
        instance_id: input.instance_id,
        name: input.name,
        status: input.status,
        prompt: input.prompt,
        model: input.model,
        cronjob: input.cronjob,
        file_ids: input.file_ids,
        feedback: input.feedback,
        progress: input.progress,
        summary: input.summary,
        last_run: input.last_run,
        failure_reason: input.failure_reason,
        payload: input.payload,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAgent(agentId: string) {
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', agentId);

  if (error) throw error;
  return { success: true };
}

export interface UpdateAgentInput {
  agentId: string;
  updates: Partial<Omit<CreateAgentInput, 'workflow_id' | 'type' | 'status'>>;
  status?: 'success' | 'running' | 'intervention' | 'pending';
}

export async function updateAgent(input: UpdateAgentInput) {
  const { agentId, updates, status } = input;

  const { data, error } = await supabase
    .from('agents')
    .update({
      ...updates,
      ...(status && { status }),
    })
    .eq('id', agentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWorkflowAgentsByWorkflowId(workflowId: string) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}