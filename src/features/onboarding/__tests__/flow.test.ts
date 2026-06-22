import { buildFlow, nextFlowIndex, prevQuestionIndex, flowIndexOfQuestion } from '@/features/onboarding/lib/flow';
import type { SectionDef } from '@/features/onboarding/config/sections';
import type { QuestionMeta } from '@/features/onboarding/config/questions';

const sections = [
  { id: 'a', title: 'A', tone: 'neutral', interstitial: { headline: 'h', body: 'b' } },
  { id: 'b', title: 'B', tone: 'warm', interstitial: { headline: 'h', body: 'b' } },
] as unknown as SectionDef[];
const questions = [
  { id: 'a1', section: 'a', title: 'a1', isComplete: () => true },
  { id: 'a2', section: 'a', title: 'a2', isComplete: () => true },
  { id: 'b1', section: 'b', title: 'b1', isComplete: () => true },
] as unknown as QuestionMeta[];
const flow = buildFlow(sections, questions);

describe('buildFlow', () => {
  it('puts an interstitial before each section, then its questions', () => {
    expect(flow.map((f) => f.kind)).toEqual(['interstitial', 'question', 'question', 'interstitial', 'question']);
  });
  it('keys are stable and unique', () => {
    const keys = flow.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('navigation', () => {
  it('nextFlowIndex steps forward and clamps at the end', () => {
    expect(nextFlowIndex(flow, 0)).toBe(1);
    expect(nextFlowIndex(flow, flow.length - 1)).toBe(flow.length - 1);
  });
  it('crossing a section boundary lands on the next interstitial', () => {
    // flow: [int-a(0), a1(1), a2(2), int-b(3), b1(4)]
    expect(flow[nextFlowIndex(flow, 2)].kind).toBe('interstitial');
  });
  it('prevQuestionIndex skips interstitials', () => {
    expect(prevQuestionIndex(flow, 4)).toBe(2);   // from b1 back to a2, skipping int-b
    expect(prevQuestionIndex(flow, 1)).toBeNull(); // first question has no previous question
  });
  it('flowIndexOfQuestion finds the question item', () => {
    expect(flow[flowIndexOfQuestion(flow, 'b1')].kind).toBe('question');
    expect(flowIndexOfQuestion(flow, 'nope')).toBe(-1);
  });
});
