
type ModelRecord = {
  path: string;
  industryKey: string;
  specializationKey: string;
  [alias: string]: string;
}

// TODO кеш
/**
 * @param keys as ["1.100", "1.101", ...]
 */
export function splitSpecialisationAndIndustry(keys: string[]): { specializationKeys: number[], industryKeys: number[] } {
  const industryKeys = []; const specializationKeys = [];

  for (const key of keys) {
    const [industryKey, specializationKey] = key.split(/\./) as [string, string | null];

    if (specializationKey) {
      specializationKeys.push(parseInt(specializationKey));
    }

    industryKeys.push(parseInt(industryKey));
  }

  return { industryKeys, specializationKeys }
}

/**
 * @param keys as ["1.100", "1.101", ...]
 * @param alias id (uid) user or quest
 * @param aliasValue value of user or quest id
 */
export function keysToRecords(keys: string[], alias: 'questId' | 'userId', aliasValue: string): ModelRecord[] {
  const records: ModelRecord[] = [];

  for (const key of keys) {
    const [industryKey, specializationKey] = key.split(/\./) as [string, string];

    records.push({
      path: key,
      industryKey,
      specializationKey,
      [alias]: aliasValue,
    });
  }

  return records;
}
