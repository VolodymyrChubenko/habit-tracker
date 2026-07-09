import { useChallengesStore } from '../store/challengesStore';
import { useChallenges } from './useChallenges';
import { today } from '../utils/dateUtils';

export const useTodayProgress = () => {
  const { activeChallenges } = useChallenges();
  const logs = useChallengesStore(s => s.logs);
  const date = today();

  const completedIds = new Set(
    logs.filter(l => l.date === date).map(l => l.challengeId),
  );

  const todoChallenges = activeChallenges.filter(h => !completedIds.has(h.id));
  const doneChallenges = activeChallenges.filter(h => completedIds.has(h.id));

  return { todoChallenges, doneChallenges, total: activeChallenges.length };
};
