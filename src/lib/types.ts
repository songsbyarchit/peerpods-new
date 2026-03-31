export type Profile = {
  id: string
  username: string
  created_at: string
}

export type Pod = {
  id: string
  title: string
  description: string | null
  tag: string
  creator_id: string
  expires_at: string
  max_members: number
  created_at: string
}

export type PodWithCount = Pod & {
  pod_members: Array<{ count: number }>
}

export type Message = {
  id: string
  pod_id: string
  user_id: string
  content: string
  created_at: string
  is_edited: boolean
  edited_at: string | null
  profiles: { username: string } | null
}

export const TOPIC_TAGS = [
  'Philosophy',
  'Relationships',
  'Tech',
  'Work',
  'Health',
  'Society',
  'Creativity',
  'Other',
] as const

export type TopicTag = (typeof TOPIC_TAGS)[number]
