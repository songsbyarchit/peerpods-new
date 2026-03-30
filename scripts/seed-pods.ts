import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '\n❌  Missing env vars. Make sure .env.local contains:\n' +
    '   NEXT_PUBLIC_SUPABASE_URL\n' +
    '   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY\n'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Time helpers ────────────────────────────────────────────────────────────

function ago(hours: number, minutes = 0): Date {
  return new Date(Date.now() - (hours * 60 + minutes) * 60_000)
}

function after(base: Date, hours: number, minutes = 0): string {
  return new Date(base.getTime() + (hours * 60 + minutes) * 60_000).toISOString()
}

// ─── Data ────────────────────────────────────────────────────────────────────

interface MsgSpec {
  username: string
  content: string
  hh: number   // hours after pod creation
  mm?: number  // extra minutes
}

interface PodSpec {
  title: string
  description: string
  tag: string
  creator: string
  createdHoursAgo: number
  durationHours: number
  members: string[]
  messages: MsgSpec[]
}

const PODS: PodSpec[] = [
  // ── Pod 1 ─────────────────────────────────────────────────────────────────
  {
    title: 'Is ambition a form of self-rejection?',
    description: 'Genuinely asking. Not sure where I land on this.',
    tag: 'Philosophy',
    creator: 'marisol',
    createdHoursAgo: 20,
    durationHours: 48,
    members: ['marisol', 'theo_k', 'nadia_r', 'dan', 'quietobserver'],
    messages: [
      {
        username: 'marisol',
        content: `ok I've been sitting with this for a few days. like when I'm working really hard toward something — is it because I love what I'm doing, or because I can't stand who I am right now`,
        hh: 0, mm: 12,
      },
      {
        username: 'theo_k',
        content: `heavy one for a tuesday lol. but yeah I think about this a lot. I grew up in a house where ambition was survival. my parents came from Baku with basically nothing so for a long time I couldn't separate "wanting better" from "running away from something"`,
        hh: 1, mm: 4,
      },
      {
        username: 'nadia_r',
        content: `the version of me that got straight A's in school genuinely hated the present me. she was only making sense to a future version of herself that didn't exist yet. I only really understood this at 28 when I burned out and couldn't get out of bed for three weeks`,
        hh: 1, mm: 48,
      },
      {
        username: 'dan',
        content: `I think there's a difference between ambition as becoming and ambition as escaping. the first feels good even when it's hard. the second feels hollow even when you succeed`,
        hh: 3, mm: 22,
      },
      {
        username: 'marisol',
        content: `dan that distinction is doing a lot of work though. how do you know which one you're in while you're IN it`,
        hh: 4, mm: 8,
      },
      {
        username: 'quietobserver',
        content: `you don't, I think. that's kind of the trap`,
        hh: 5, mm: 1,
      },
      {
        username: 'theo_k',
        content: `also the running-from thing isn't always bad? like my dad rejected the present too and that's why we have a house and I went to university. it's more complicated than it looks from the outside`,
        hh: 6, mm: 33,
      },
      {
        username: 'nadia_r',
        content: `yeah but does the house make it okay that he missed things along the way. I'm not saying it doesn't. genuinely asking`,
        hh: 8, mm: 2,
      },
      {
        username: 'dan',
        content: `I think the real tell is what you do when you get there. if you arrive at the thing and within a week you're already chasing the next thing without breathing... that's probably the self-rejection version`,
        hh: 10, mm: 17,
      },
      {
        username: 'marisol',
        content: `god I do that. I finished my masters and within like a week I was already applying for PhD programs. I didn't let myself feel anything about it at all`,
        hh: 12, mm: 5,
      },
      {
        username: 'quietobserver',
        content: `I wonder if some people just don't have a "there". not running toward or away. they just keep moving because stillness is too loud`,
        hh: 15, mm: 44,
      },
      {
        username: 'theo_k',
        content: `stillness is where all the questions live I think. the ambition keeps them quiet`,
        hh: 18, mm: 20,
      },
    ],
  },

  // ── Pod 2 ─────────────────────────────────────────────────────────────────
  {
    title: 'The loneliness of being good at your job',
    description: `Not complaining exactly. More like... naming something I haven't seen named.`,
    tag: 'Work',
    creator: 'elliot',
    createdHoursAgo: 48,
    durationHours: 168,
    members: ['elliot', 'marisol', 'dan', 'priya', 'theo_k', 'nadia_r'],
    messages: [
      {
        username: 'elliot',
        content: `my skip-level told me last week that I'm the most reliable person on the team and I went home and felt nothing. not proud-nothing. just... nothing`,
        hh: 0, mm: 9,
      },
      {
        username: 'marisol',
        content: `reliability as a compliment always feels like "you're not exciting but you don't break". like. thanks?`,
        hh: 2, mm: 14,
      },
      {
        username: 'priya',
        content: `there's something so specific about being the person people call when things are on fire. you're important but only in crisis. the rest of the time you're just... there. present but not seen`,
        hh: 4, mm: 3,
      },
      {
        username: 'dan',
        content: `my old manager in Dubai used to say I was the only one he trusted with the hard stuff and somehow that made me feel more alone, not less. like I was load-bearing but invisible`,
        hh: 6, mm: 28,
      },
      {
        username: 'elliot',
        content: `dan that's exactly it. load-bearing but invisible. I'm going to be thinking about that phrase for a while`,
        hh: 8, mm: 11,
      },
      {
        username: 'theo_k',
        content: `I think the loneliness compounds because competence is a closed loop. you're good, so they give you more, so you get better at managing more, so you're more alone at the top of it. nobody checks in on the person who looks like they have it handled`,
        hh: 14, mm: 37,
      },
      {
        username: 'nadia_r',
        content: `I had a breakdown in a Pret in Canary Wharf at 7am once. just sitting there with my laptop and my oat latte and I was just... crying. quietly. nobody looked up. we were all the same`,
        hh: 20, mm: 22,
      },
      {
        username: 'priya',
        content: `nadia that image. I worked in Canary Wharf for two years. I know exactly which Pret. I probably walked past you`,
        hh: 28, mm: 5,
      },
      {
        username: 'marisol',
        content: `the worst part is that asking for help starts to feel like admitting you shouldn't have been trusted with any of it in the first place`,
        hh: 34, mm: 18,
      },
      {
        username: 'elliot',
        content: `yeah. so you just don't ask. and then one day you're in a planning meeting and someone says "elliot handles that" about a thing you've literally never done before and you just... nod`,
        hh: 40, mm: 9,
      },
      {
        username: 'dan',
        content: `the nod. god. the nod is its own whole language`,
        hh: 44, mm: 52,
      },
    ],
  },

  // ── Pod 3 ─────────────────────────────────────────────────────────────────
  {
    title: 'Do we choose our values or discover them?',
    description: `Reading Iris Murdoch and it's making me question everything I thought I knew about moral agency.`,
    tag: 'Philosophy',
    creator: 'priya',
    createdHoursAgo: 8,
    durationHours: 24,
    members: ['priya', 'quietobserver', 'theo_k', 'marisol'],
    messages: [
      {
        username: 'priya',
        content: `Iris Murdoch has this idea that moral vision is something you develop through attention, not through choice. like you don't decide to value honesty — you slowly learn to see more clearly until honesty is just what you see`,
        hh: 0, mm: 6,
      },
      {
        username: 'quietobserver',
        content: `that resonates. I don't think I chose to care about fairness. I think I discovered I already did when I watched my younger sister get treated differently at school and felt something I couldn't name at the time`,
        hh: 0, mm: 34,
      },
      {
        username: 'theo_k',
        content: `but there's a selection effect right. we "discover" values that our environment shaped us to have. I "discovered" that hard work matters. my parents installed that. is that discovery or is it inheritance with extra steps`,
        hh: 1, mm: 31,
      },
      {
        username: 'marisol',
        content: `theo I actually think both can be true. you discover the value AND you can choose to interrogate it. the discovery is step one. what you do after is something else`,
        hh: 2, mm: 28,
      },
      {
        username: 'priya',
        content: `Murdoch would say even the interrogation isn't quite choosing. it's more like... clearing your vision. removing distortions. the will is involved but it's not sovereign`,
        hh: 3, mm: 4,
      },
      {
        username: 'quietobserver',
        content: `I think the discover/choose framing might be a false binary. there's no "me" prior to the values who could have done the choosing anyway`,
        hh: 4, mm: 12,
      },
      {
        username: 'theo_k',
        content: `okay that's actually a very good point and I have no response`,
        hh: 5, mm: 29,
      },
      {
        username: 'marisol',
        content: `quietobserver drops the grenade and goes quiet lol. but yes. who IS doing the choosing, if not someone who already has some values they didn't choose`,
        hh: 7, mm: 3,
      },
    ],
  },

  // ── Pod 4 ─────────────────────────────────────────────────────────────────
  {
    title: 'Why is it so hard to start creative work?',
    description: `I know what I want to make. I cannot begin. Let's talk about this.`,
    tag: 'Creativity',
    creator: 'nadia_r',
    createdHoursAgo: 30,
    durationHours: 48,
    members: ['nadia_r', 'elliot', 'dan', 'priya', 'quietobserver'],
    messages: [
      {
        username: 'nadia_r',
        content: `genuine question because I've been sitting in front of the same blank document for three weeks. I know what the thing is. I know roughly what it should say. I just cannot start`,
        hh: 0, mm: 8,
      },
      {
        username: 'elliot',
        content: `there's this coffee shop on Brick Lane I used to go to every morning when I was trying to write my dissertation. I'd sit there for 3 hours and write maybe 200 words. but those 200 words were always the right 200 words. I think the sitting is doing something even when it looks like nothing`,
        hh: 1, mm: 3,
      },
      {
        username: 'dan',
        content: `I think starting is terrifying because starting makes it real. a thing in your head is perfect and infinite. a thing on the page is specific and therefore already wrong in some way`,
        hh: 2, mm: 31,
      },
      {
        username: 'priya',
        content: `the specificity thing is so true. I spent six months "developing" a project in my head that was going to be a masterpiece. then I wrote the first scene and it was bad. I nearly abandoned the whole thing`,
        hh: 4, mm: 14,
      },
      {
        username: 'quietobserver',
        content: `maybe the resistance is useful information. what are you actually resisting about this specific thing, nadia`,
        hh: 6, mm: 2,
      },
      {
        username: 'nadia_r',
        content: `probably that it's about my family. and if I write it down and it's bad, then I've used something that matters and gotten nothing back`,
        hh: 8, mm: 19,
      },
      {
        username: 'elliot',
        content: `oh. that's a different problem than I thought this pod was about`,
        hh: 10, mm: 7,
      },
      {
        username: 'dan',
        content: `nadia the fact that you can name it that clearly is actually kind of the beginning of writing it`,
        hh: 14, mm: 33,
      },
      {
        username: 'priya',
        content: `the bad version isn't a waste. it's excavation. you write the bad version to find out what the good version is trying to say. they're not separate drafts, they're the same process`,
        hh: 18, mm: 11,
      },
      {
        username: 'nadia_r',
        content: `okay. I wrote 600 words just now. they're not good. but they exist and I feel weirdly okay about it. thank you all, I didn't expect this pod to actually help`,
        hh: 23, mm: 44,
      },
    ],
  },

  // ── Pod 5 ─────────────────────────────────────────────────────────────────
  {
    title: 'Cities that change you vs cities that comfort you',
    description: `I've lived in four. Each one did something different. Curious what others have found.`,
    tag: 'Society',
    creator: 'dan',
    createdHoursAgo: 72,
    durationHours: 168,
    members: ['dan', 'marisol', 'theo_k', 'nadia_r', 'elliot', 'quietobserver', 'priya'],
    messages: [
      {
        username: 'dan',
        content: `I've lived in four cities and they all did something different to me. Beirut made me brave. London made me quiet. Toronto made me comfortable in a way that worried me. and now I'm in Oslo and I don't know what it's making me yet`,
        hh: 0, mm: 14,
      },
      {
        username: 'marisol',
        content: `I moved from Lahore to Manchester at 22 and spent the first winter just... grey. not sad exactly. emotionally grey. like someone had turned the saturation down on everything including me. it took about two years before I felt colour again`,
        hh: 3, mm: 7,
      },
      {
        username: 'theo_k',
        content: `Baku to Berlin at 19. Berlin cracked me open, not always in good ways. it's a city with no small talk and I came from a place of nothing but. I cried on the U-Bahn embarrassingly many times that first year`,
        hh: 6, mm: 22,
      },
      {
        username: 'elliot',
        content: `London is strange because it changes you and comforts you at the same time. you can be completely alone and completely held simultaneously. it's the only place I've lived where I felt invisible and exactly myself at once`,
        hh: 10, mm: 5,
      },
      {
        username: 'nadia_r',
        content: `marisol the emotionally grey thing — yes. when I moved from Cairo to Edinburgh I had this same feeling. like colour had been turned down 15%. it became beautiful eventually. but it took so long, and I didn't know I was waiting`,
        hh: 14, mm: 38,
      },
      {
        username: 'quietobserver',
        content: `I've only ever lived in one city. reading this thread makes me feel something I can't quite name`,
        hh: 20, mm: 11,
      },
      {
        username: 'dan',
        content: `quietobserver — does your city change you even when you stay? or does it become invisible`,
        hh: 26, mm: 3,
      },
      {
        username: 'marisol',
        content: `the cities that comfort you are sometimes where you stop growing. I loved Lahore deeply but I knew I'd become the exact person my neighbourhood expected me to be. that wasn't a bad life. it just wasn't mine`,
        hh: 32, mm: 29,
      },
      {
        username: 'theo_k',
        content: `displacement makes you actually see a place. I noticed Berlin far more than I ever noticed Baku growing up. familiarity is a kind of blindness`,
        hh: 38, mm: 44,
      },
      {
        username: 'priya',
        content: `I lived in Bangalore, then Singapore, then moved back to Bangalore. the second time I saw my own city like a tourist. which was disorienting and wonderful and a bit sad. all at exactly the same time`,
        hh: 46, mm: 17,
      },
      {
        username: 'elliot',
        content: `dan — Oslo is a city that waits. it doesn't change you fast. you change slowly without noticing and then one day you're different`,
        hh: 52, mm: 8,
      },
      {
        username: 'dan',
        content: `elliot I'm going to hold onto that. it actually makes me less anxious about not being able to name what's happening yet`,
        hh: 58, mm: 34,
      },
    ],
  },
]

// ─── Runner ──────────────────────────────────────────────────────────────────

async function seedPods() {
  console.log('\n🌱  Seeding pods and conversations...\n')

  // Fetch all seed users by username → uuid
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')

  if (profilesError || !profiles?.length) {
    console.error('❌  Could not load profiles. Run `npm run seed` first.\n', profilesError?.message)
    process.exit(1)
  }

  const users: Record<string, string> = {}
  for (const p of profiles) users[p.username] = p.id

  console.log(`   Found ${profiles.length} profiles: ${Object.keys(users).join(', ')}\n`)

  for (const pod of PODS) {
    // ── Skip if already exists ───────────────────────────────────────────
    const { data: existing } = await supabase
      .from('pods')
      .select('id')
      .eq('title', pod.title)
      .maybeSingle()

    if (existing) {
      console.log(`⏭   "${pod.title}" — already exists, skipping`)
      continue
    }

    // ── Verify all referenced users exist ────────────────────────────────
    const allUsernames = Array.from(new Set([pod.creator, ...pod.members, ...pod.messages.map(m => m.username)]))
    const missing = allUsernames.filter(u => !users[u])
    if (missing.length) {
      console.warn(`⚠️   "${pod.title}" — missing users: ${missing.join(', ')}. Skipping.`)
      continue
    }

    const creatorId = users[pod.creator]
    const podCreatedAt = ago(pod.createdHoursAgo)
    const expiresAt = after(podCreatedAt, pod.durationHours)

    // ── Insert pod ───────────────────────────────────────────────────────
    const { data: newPod, error: podError } = await supabase
      .from('pods')
      .insert({
        title: pod.title,
        description: pod.description,
        tag: pod.tag,
        creator_id: creatorId,
        expires_at: expiresAt,
        max_members: 8,
        created_at: podCreatedAt.toISOString(),
      })
      .select('id')
      .single()

    if (podError || !newPod) {
      console.error(`❌  "${pod.title}" — pod insert failed: ${podError?.message}`)
      continue
    }

    const podId = newPod.id

    // ── Insert pod_members ───────────────────────────────────────────────
    const memberRows = pod.members.map((username, i) => ({
      pod_id: podId,
      user_id: users[username],
      joined_at: after(podCreatedAt, 0, i * 3), // stagger joins by a few minutes
    }))

    const { error: membersError } = await supabase.from('pod_members').insert(memberRows)
    if (membersError) {
      console.error(`❌  "${pod.title}" — members insert failed: ${membersError.message}`)
      continue
    }

    // ── Insert messages ──────────────────────────────────────────────────
    const messageRows = pod.messages.map(msg => ({
      pod_id: podId,
      user_id: users[msg.username],
      content: msg.content,
      created_at: after(podCreatedAt, msg.hh, msg.mm ?? 0),
    }))

    const { error: msgsError } = await supabase.from('messages').insert(messageRows)
    if (msgsError) {
      console.error(`❌  "${pod.title}" — messages insert failed: ${msgsError.message}`)
      continue
    }

    console.log(`✅  "${pod.title}"`)
    console.log(`    ${pod.members.length} members · ${pod.messages.length} messages · expires ${new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`)
  }

  console.log('\n✨  Done.\n')
}

seedPods().catch(err => {
  console.error(err)
  process.exit(1)
})
