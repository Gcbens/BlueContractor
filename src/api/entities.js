import { supabase } from './supabaseClient';

// Sort strings use the "-created_date" convention; the actual Postgres column is "created_at".
function resolveOrder(sort) {
  if (!sort) return null;
  const desc = sort.startsWith('-');
  const rawField = desc ? sort.slice(1) : sort;
  const field = rawField === 'created_date' ? 'created_at' : rawField;
  return { field, ascending: !desc };
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id;
}

function makeEntity(table) {
  return {
    async list(sort, limit) {
      let query = supabase.from(table).select('*');
      const order = resolveOrder(sort);
      if (order) query = query.order(order.field, { ascending: order.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      const userId = await currentUserId();
      const { data, error } = await supabase
        .from(table)
        .insert({ ...payload, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },

    async filter(match, sort, limit) {
      let query = supabase.from(table).select('*').match(match);
      const order = resolveOrder(sort);
      if (order) query = query.order(order.field, { ascending: order.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  };
}

export const Estimate = makeEntity('estimates');
export const Customer = makeEntity('customers');
