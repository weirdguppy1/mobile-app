import { transitionParams } from '@/shared/components/animations/transition-params';

describe('transitionParams', () => {
  it('question forward slides in from the right, no scale', () => {
    const p = transitionParams('question', 'forward', false);
    expect(p.enterFrom.x).toBeGreaterThan(0);
    expect(p.enterFrom.scale).toBe(1);
    expect(p.exitTo.x).toBeLessThan(0);
  });
  it('question back reverses the slide', () => {
    const p = transitionParams('question', 'back', false);
    expect(p.enterFrom.x).toBeLessThan(0);
    expect(p.exitTo.x).toBeGreaterThan(0);
  });
  it('section variant scales (no slide) and runs longer than question', () => {
    const section = transitionParams('section', 'forward', false);
    const question = transitionParams('question', 'forward', false);
    expect(section.enterFrom.x).toBe(0);
    expect(section.enterFrom.scale).toBeLessThan(1);
    expect(section.enterMs).toBeGreaterThan(question.enterMs);
  });
  it('reduced motion zeroes movement for both variants', () => {
    for (const v of ['question', 'section'] as const) {
      const p = transitionParams(v, 'forward', true);
      expect(p.enterFrom.x).toBe(0);
      expect(p.enterFrom.scale).toBe(1);
    }
  });
});
