import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingOverlay } from '@/features/auth/components/loading-overlay';
import { OtpInput } from '@/features/auth/components/otp-input';
import { ProgressBar } from '@/features/auth/components/progress-bar';
import { ALCOHOL, INTERESTS } from '@/features/profile/constants';
import {
  ActivateRamp, Button, CheckPop, ConfettiBurst, FadeIn, Field, FocusScale,
  OptionGroup, PhotoGrid, PressScale, ScaleInput, SpotlightProvider, SpotlightScrim,
  SpotlightSlot, TagInput, TextField,
} from '@/shared/components';
import { ContinueOverlay } from '@/features/onboarding/components/ContinueOverlay';
import { OnboardingProgress } from '@/features/onboarding/components/OnboardingProgress';
import { QuestionShell } from '@/features/onboarding/components/QuestionShell';
import { NavBar } from '@/features/navigation/components/NavBar';
import { TABS } from '@/features/navigation/config/tabs';

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

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="dark" />
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

          <Section title="Navigation — NavBar (bottom tabs)">
            <View className="overflow-hidden rounded-2xl border border-silver">
              <NavBar tabs={TABS} activeName={navTab} onPressTab={setNavTab} />
            </View>
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
