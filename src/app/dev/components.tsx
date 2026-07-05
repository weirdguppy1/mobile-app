import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingOverlay } from '@/features/auth/components/loading-overlay';
import { OtpInput } from '@/features/auth/components/otp-input';
import { ProgressBar } from '@/features/auth/components/progress-bar';
import { ALCOHOL, INTERESTS, PROMPT_CATEGORIES } from '@/features/profile/constants';
import { DARK_PAGE, DiscoverWashes } from '@/constants/theme';
import {
  ActivateRamp, Button, CheckPop, ConfettiBurst, FadeIn, Field, FocusScale,
  GlassCard, GlassSheet, OptionGroup, PhotoGrid, PressScale, ScaleInput, SheetModal,
  SpotlightProvider, SpotlightScrim, SpotlightSlot, TagInput, TextField,
} from '@/shared/components';
import { AddPromptButton } from '@/features/onboarding/components/AddPromptButton';
import { ContinueOverlay } from '@/features/onboarding/components/ContinueOverlay';
import { OnboardingProgress } from '@/features/onboarding/components/OnboardingProgress';
import { PromptCard } from '@/features/onboarding/components/PromptCard';
import { PromptPickerSheet } from '@/features/onboarding/components/PromptPickerSheet';
import { SectionProgress } from '@/features/onboarding/components/SectionProgress';
import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
import { SectionInterstitial } from '@/features/onboarding/components/SectionInterstitial';
import { SECTIONS } from '@/features/onboarding/config/sections';
import { ProfileView } from '@/features/profile/components/ProfileView';
import { PhotoCarousel } from '@/features/profile/components/PhotoCarousel';
import { SocialsBar } from '@/features/profile/components/SocialsBar';
import { Profile, ProfilePrompt, SignedProfilePhoto } from '@/features/profile/types';
import { CompatibilityCard } from '@/features/discovery/components/CompatibilityCard';
import { DiscoveryEmptyState } from '@/features/discovery/components/DiscoveryEmptyState';
import { RequestHeart } from '@/features/discovery/components/RequestHeart';
import { RequestSheet } from '@/features/discovery/components/RequestSheet';
import { SkipButton } from '@/features/discovery/components/SkipButton';
import { NavBar } from '@/features/navigation/components/NavBar';
import { TABS } from '@/features/navigation/config/tabs';
import { ChatComposer } from '@/features/messaging/components/ChatComposer';
import { ChatHeader } from '@/features/messaging/components/ChatHeader';
import { ConversationRow } from '@/features/messaging/components/ConversationRow';
import { EmptyConversations } from '@/features/messaging/components/EmptyConversations';
import { MessageBubble } from '@/features/messaging/components/MessageBubble';
import { ReactionBar } from '@/features/messaging/components/ReactionBar';
import { Conversation, MessageWithReactions, PeerSummary } from '@/features/messaging/types';
import { ConnectionCelebration } from '@/features/notifications/components/ConnectionCelebration';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import { NotificationItem } from '@/features/notifications/types';

const mockProfile = {
  id: 'demo', email: 'julia@stanford.edu', school_domain: 'stanford.edu',
  first_name: 'Julia', pronouns: 'she/her', university: 'Stanford',
  graduation_year: 2027, majors: ['Computer Science', 'Design'],
  gender_identity: 'Woman', sex_assigned_at_birth: 'female', sexual_orientation: 'straight',
  sleep_schedule: 'night_owl', bedtime: 'after_midnight', wakeup_time: 'after_9am',
  cleanliness: 4, noise_preference: 'moderate_ok', study_style: 'mix',
  guests_frequency: 'occasionally', romantic_guests_frequency: 'rarely',
  social_level: 3, room_temperature: 'cold', alcohol: 'occasionally', smoking: 'no',
  parties: 'sometimes', fitness: 'regularly', interests: ['gym', 'music', 'coding', 'reading', 'movies'],
  deal_breakers: ['smoking', 'noise_levels'], dorm_preference: 'North campus', living_program: 'Honors',
  clubs: ['ACM', 'Climbing'], instagram: '@julia', linkedin: 'linkedin.com/in/julia', snapchat: '@julia.snap',
  about_me: 'CS major who loves late-night ramen, bouldering, and bad horror movies.',
  hidden_fields: [], onboarding_complete: true, created_at: '', updated_at: '',
} as unknown as Profile;
const mockPhotos = [
  { id: '1', profile_id: 'demo', url: '', position: 0, created_at: '', signedUrl: 'https://placehold.co/400x500' },
  { id: '2', profile_id: 'demo', url: '', position: 1, created_at: '', signedUrl: 'https://placehold.co/400x500' },
] as unknown as SignedProfilePhoto[];
const mockPrompts = [
  { id: 'a', profile_id: 'demo', prompt: 'You should room with me if...', answer: 'you also think 2am is a perfectly good time for ramen.', position: 0, created_at: '' },
] as unknown as ProfilePrompt[];

const mockPeer: PeerSummary = { id: 'p', firstName: 'Julia', avatarUrl: 'https://placehold.co/100' };
const mockConversation: Conversation = {
  match: { id: 'm1', user_a: 'me', user_b: 'p', created_at: '2024-06-01T12:00:00Z' },
  peer: mockPeer,
  lastMessage: { id: 'x', match_id: 'm1', sender_id: 'p', body: 'see you at orientation! 🎉', created_at: '2024-06-01T12:00:00Z', read_at: null },
  unread: 2,
};
const mockTheirs: MessageWithReactions = {
  id: 't1', match_id: 'm1', sender_id: 'p', body: 'wait we have the same major lol', created_at: '2024-06-01T12:00:00Z', read_at: null,
  reactions: [{ message_id: 't1', match_id: 'm1', user_id: 'me', emoji: '❤️', created_at: '2024-06-01T12:00:00Z' }],
};
const mockMine: MessageWithReactions = {
  id: 'mine1', match_id: 'm1', sender_id: 'me', body: 'no way 😄 we should def room together', created_at: '2024-06-01T12:01:00Z', read_at: '2024-06-01T12:02:00Z', reactions: [],
};

const mockNotifs: NotificationItem[] = [
  { id: 'n1', user_id: 'me', type: 'request', actor_id: 'p', match_id: null, message_id: null, preview: null, read: false, created_at: '2024-06-01T12:00:00Z', actor: { id: 'p', firstName: 'Julia', avatarUrl: 'https://placehold.co/100' } },
  { id: 'n2', user_id: 'me', type: 'message', actor_id: 'q', match_id: 'm1', message_id: null, preview: 'see you at orientation!', read: true, created_at: '2024-06-01T11:00:00Z', actor: { id: 'q', firstName: 'Maya', avatarUrl: 'https://placehold.co/100' } },
  { id: 'n3', user_id: 'me', type: 'match', actor_id: 'r', match_id: 'm2', message_id: null, preview: null, read: false, created_at: '2024-06-01T10:00:00Z', actor: { id: 'r', firstName: 'Sam', avatarUrl: null } },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="prose-caption font-semibold text-ash">{title}</Text>
      {children}
    </View>
  );
}

export default function ComponentsGallery() {
  const [otp, setOtp] = useState('');
  const [single, setSingle] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [scale, setScale] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [active, setActive] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confettiOn, setConfettiOn] = useState(false);
  const [navTab, setNavTab] = useState('discover');
  const [promptSheetOpen, setPromptSheetOpen] = useState(false);
  const [demoAnswer, setDemoAnswer] = useState('Late-night ramen and a movie.');
  const [requestSheetOpen, setRequestSheetOpen] = useState(false);
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <ScrollView className="flex-1" contentContainerClassName="gap-8 px-6 py-6">
          <Section title="Typography">
            <Text className="prose-display text-ink">Display</Text>
            <Text className="prose-title text-ink">Title</Text>
            <Text className="prose-subtitle">Subtitle / lead paragraph</Text>
            <Text className="prose-body text-ink">Body</Text>
            <Text className="prose-label">Field label</Text>
            <Text className="prose-footnote text-slate">Footnote / helper</Text>
            <Text className="prose-caption text-ash">Caption</Text>
          </Section>

          <Section title="Buttons">
            <PressScale className="button-primary">
              <Text className="prose-button text-canvas">button-primary</Text>
            </PressScale>
            <PressScale className="button-ghost">
              <Text className="prose-footnote font-medium text-graphite">button-ghost</Text>
            </PressScale>
          </Section>

          <Section title="Primitives — Button">
            <Button variant="primary" onPress={() => {}}>Primary</Button>
            <Button variant="ghost" onPress={() => {}}>Ghost</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </Section>

          <Section title="Primitives — Field">
            <Field label="With label" optional error="Example error">
              <View className="card border-continuous px-4 py-3">
                <Text className="prose-body text-ink">control goes here</Text>
              </View>
            </Field>
          </Section>

          <Section title="Inputs">
            <TextField label="Default" placeholder="placeholder" />
            <TextField label="Invalid" invalid message="Something is wrong" value="bad" />
            <OtpInput value={otp} onChange={setOtp} />
          </Section>

          <Section title="Surfaces">
            <View className="card border-continuous px-4 py-4">
              <Text className="prose-body text-ink">card</Text>
            </View>
            <View className="card border-continuous shadow-card px-4 py-4">
              <Text className="prose-body text-ink">card + shadow-card</Text>
            </View>
          </Section>

          <Section title="Glass — GlassCard / GlassSheet / heart (real blur over a wash)">
            <View
              className="overflow-hidden rounded-2xl"
              style={{ backgroundColor: DARK_PAGE, experimental_backgroundImage: DiscoverWashes[0].stops }}>
              <View className="gap-4 p-4">
                <GlassCard className="gap-2 px-5 py-5">
                  <Text className="prose-footnote text-slate">My ideal roommate Sunday</Text>
                  <Text className="font-primary text-2xl font-bold tracking-tight text-ink">
                    Slow coffee, loud music, no judgment.
                  </Text>
                </GlassCard>
                <View className="flex-row">
                  <RequestHeart target={{ kind: 'photo', photoId: '1' }} onPress={() => {}} />
                </View>
                <GlassSheet className="gap-1 px-5 pb-6 pt-4">
                  <Text className="prose-footnote text-slate">GlassSheet</Text>
                  <Text className="prose-body text-ink">Like-sheet / match-modal surface</Text>
                </GlassSheet>
              </View>
            </View>
          </Section>

          <Section title="Feedback">
            <ProgressBar current={2} total={3} />
            <View className="h-44 overflow-hidden rounded-xl border border-silver">
              <LoadingOverlay message="Creating your account..." />
            </View>
          </Section>

          <Section title="Motion">
            <FadeIn>
              <Text className="prose-body text-ink">FadeIn content</Text>
            </FadeIn>
          </Section>

          <Section title="Animations — FocusScale">
            <FocusScale className="card border-continuous px-4 py-4">
              <Text className="prose-body text-ink">Breathing-in on mount</Text>
            </FocusScale>
          </Section>

          <Section title="Animations — ActivateRamp / CheckPop">
            <PressScale className="button-ghost" onPress={() => setActive((v) => !v)}>
              <Text className="prose-footnote font-medium text-graphite">Toggle active: {String(active)}</Text>
            </PressScale>
            <ActivateRamp active={active}>
              <View className="button-primary">
                <Text className="prose-button text-canvas">Ramps in when active</Text>
              </View>
            </ActivateRamp>
            <PressScale className="button-ghost" onPress={() => setConfirmed((v) => !v)}>
              <Text className="prose-footnote font-medium text-graphite">Toggle check</Text>
            </PressScale>
            <CheckPop show={confirmed} />
          </Section>

          <Section title="Animations — OnboardingProgress">
            <OnboardingProgress current={2} total={5} />
          </Section>

          <Section title="Onboarding — SectionProgress">
            <SectionProgress title="Living habits" current={3} total={10} />
          </Section>

          <Section title="Animations — Spotlight (focus a field)">
            <SpotlightProvider>
              <View className="gap-3">
                <SpotlightSlot index={0}>
                  <TextField label="Focus me — others blur" placeholder="tap to focus" />
                </SpotlightSlot>
                <SpotlightSlot index={1}>
                  <TextField label="Sibling field" placeholder="blurs while the other is focused" />
                </SpotlightSlot>
                <SpotlightScrim />
              </View>
            </SpotlightProvider>
          </Section>

          <Section title="Animations — Confetti">
            <PressScale className="button-primary" onPress={() => setConfettiOn(true)}>
              <Text className="prose-button text-canvas">Fire confetti</Text>
            </PressScale>
            {confettiOn ? <ConfettiBurst onComplete={() => setConfettiOn(false)} /> : null}
          </Section>

          <Section title="Onboarding — ContinueOverlay">
            <View className="h-40 overflow-hidden rounded-2xl border border-silver bg-wash">
              <ContinueOverlay canAdvance onNext={() => {}} />
            </View>
          </Section>

          <Section title="Onboarding — QuestionShell">
            <View className="h-96 overflow-hidden rounded-2xl border border-silver">
              <QuestionShell
                title={"What's your\nname?"}
                subtitle="Your preferred name."
                canGoBack
                onBack={() => {}}
                canAdvance
                onNext={() => {}}>
                <TextField placeholder="Preferred name" />
              </QuestionShell>
            </View>
          </Section>

          <Section title="Onboarding — SectionInterstitial">
            <View className="h-96 overflow-hidden rounded-2xl border border-silver">
              <SectionInterstitial
                headline={SECTIONS[0].interstitial.headline}
                body={SECTIONS[0].interstitial.body}
                schoolLabel="Signed in as student@stanford.edu"
                onContinue={() => {}}
              />
            </View>
          </Section>

          <Section title="Onboarding — Prompts (add button, card, picker)">
            <AddPromptButton onPress={() => setPromptSheetOpen(true)} />
            <AddPromptButton label="Add another" onPress={() => setPromptSheetOpen(true)} />
            <PromptCard
              prompt="My ideal Friday night is..."
              answer={demoAnswer}
              onChangeAnswer={setDemoAnswer}
              onRemove={() => {}}
            />
            <PromptPickerSheet
              visible={promptSheetOpen}
              categories={PROMPT_CATEGORIES}
              onSelect={() => setPromptSheetOpen(false)}
              onClose={() => setPromptSheetOpen(false)}
            />
          </Section>

          <Section title="Profile — SocialsBar (Instagram / LinkedIn / Snapchat)">
            <SocialsBar profile={mockProfile} />
          </Section>

          <Section title="Profile — PhotoCarousel (paged, full-bleed)">
            <View className="overflow-hidden rounded-2xl border border-silver">
              <PhotoCarousel photos={mockPhotos} />
            </View>
          </Section>

          <Section title="Profile — ProfileView (read-only)">
            <View className="h-150 overflow-hidden rounded-2xl border border-silver">
              <ProfileView profile={mockProfile} photos={mockPhotos} prompts={mockPrompts} />
            </View>
          </Section>

          <Section title="Discovery — request card (ProfileView + hearts + skip)">
            <View className="h-150 overflow-hidden rounded-2xl border border-silver">
              <ProfileView
                profile={mockProfile}
                photos={mockPhotos}
                prompts={mockPrompts}
                showDetails={false}
                renderPhotoOverlay={(photo) => (
                  <RequestHeart target={{ kind: 'photo', photoId: photo.id }} onPress={() => setRequestSheetOpen(true)} />
                )}
                renderPromptOverlay={(prompt) => (
                  <RequestHeart target={{ kind: 'prompt', promptId: prompt.id }} onPress={() => setRequestSheetOpen(true)} />
                )}
              />
              <SkipButton onPress={() => {}} className="absolute bottom-4 left-4" />
            </View>
            <Button variant="ghost" onPress={() => setRequestSheetOpen(true)}>Open request sheet</Button>
            <RequestSheet
              visible={requestSheetOpen}
              preview={{ kind: 'prompt', prompt: mockPrompts[0].prompt, answer: mockPrompts[0].answer }}
              recipientName={mockProfile.first_name}
              recipientPhotoUrl={mockPhotos[0].signedUrl}
              onSubmit={async () => {}}
              onComplete={() => setRequestSheetOpen(false)}
              onClose={() => setRequestSheetOpen(false)}
            />
          </Section>

          <Section title="Shared — SheetModal (glass sheet shell: pull-down / X / backdrop dismiss)">
            <Button variant="ghost" onPress={() => setSheetModalOpen(true)}>Open sheet modal</Button>
            <SheetModal visible={sheetModalOpen} title="Sheet modal" onClose={() => setSheetModalOpen(false)}>
              <View className="gap-2 px-6 py-4">
                <Text className="prose-footnote text-slate">
                  Shared bottom-sheet shell. Pull the header down, tap the X, or tap the backdrop.
                </Text>
              </View>
            </SheetModal>
          </Section>

          <Section title="Discovery — compatibility card (count-up on mount)">
            <CompatibilityCard
              compatibility={{
                score: 92,
                emoji: '🔥',
                reasons: ['Similar sleep schedules', 'Both prefer quiet study environments', '3 shared interests'],
              }}
            />
          </Section>

          <Section title="Discovery — empty state">
            <View className="h-80 overflow-hidden rounded-2xl border border-silver">
              <DiscoveryEmptyState onRefresh={() => {}} />
            </View>
          </Section>

          <Section title="Navigation — NavBar (bottom tabs)">
            <View className="overflow-hidden rounded-2xl border border-silver">
              <NavBar tabs={TABS} activeName={navTab} onPressTab={setNavTab} badges={{ messages: 3 }} />
            </View>
          </Section>

          <Section title="Messaging — conversation row">
            <View className="overflow-hidden rounded-2xl border border-silver">
              <ConversationRow conversation={mockConversation} onPress={() => {}} />
            </View>
          </Section>

          <Section title="Messaging — bubbles + reactions">
            <View className="rounded-2xl border border-silver py-2">
              <MessageBubble message={mockTheirs} isMine={false} myUserId="me" isLastOwn={false} onLongPress={() => {}} />
              <MessageBubble message={mockMine} isMine myUserId="me" isLastOwn onLongPress={() => {}} />
            </View>
          </Section>

          <Section title="Messaging — chat header + reaction bar + composer">
            <View className="gap-3 rounded-2xl border border-silver py-2">
              <ChatHeader peer={mockPeer} onBack={() => {}} />
              <View className="items-center"><ReactionBar selected="❤️" onPick={() => {}} /></View>
              <ChatComposer onSend={() => {}} onTyping={() => {}} />
            </View>
          </Section>

          <Section title="Messaging — empty conversations">
            <View className="h-72 overflow-hidden rounded-2xl border border-silver">
              <EmptyConversations />
            </View>
          </Section>

          <Section title="Notifications — rows (request / message / match; unread rows get the new treatment)">
            <View className="rounded-2xl border border-silver py-1">
              {mockNotifs.map((n) => (
                <NotificationRow key={n.id} item={n} isNew={!n.read} onOpen={() => {}} onAccept={() => {}} onDecline={() => {}} />
              ))}
            </View>
          </Section>

          <Section title="Notifications — connection celebration">
            <Button variant="ghost" onPress={() => setCelebrating(true)}>Play connection celebration</Button>
            <ConnectionCelebration
              visible={celebrating}
              origin={null}
              meAvatarUrl="https://placehold.co/100"
              themAvatarUrl="https://placehold.co/100"
              meName="You"
              themName="Julia"
              onComplete={() => setCelebrating(false)}
            />
          </Section>

          <Section title="Primitives — OptionGroup">
            <Text className="prose-caption text-ash">Single-select</Text>
            <OptionGroup options={ALCOHOL} value={single} onChange={setSingle} />
            <Text className="prose-caption text-ash">Multi-select (max 3)</Text>
            <OptionGroup multiple options={INTERESTS} value={multi} onChange={setMulti} max={3} />
          </Section>

          <Section title="Primitives — ScaleInput / TagInput">
            <ScaleInput value={scale} onChange={setScale} lowLabel="Messy" highLabel="Spotless" />
            <TagInput value={tags} onChange={setTags} max={3} placeholder="Add a major" />
          </Section>

          <Section title="Primitives — PhotoGrid">
            <PhotoGrid
              photos={[
                { id: '1', uri: 'https://placehold.co/300', status: 'ready' },
                { id: '2', uri: 'https://placehold.co/300', status: 'error' },
              ]}
              onAdd={() => {}}
              onRemove={() => {}}
              onReorder={() => {}}
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
