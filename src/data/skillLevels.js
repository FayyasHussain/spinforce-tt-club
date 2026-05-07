export const skillLevelOptions = [
  { value: 0, label: 'Not Started' },
  { value: 1, label: 'Learning' },
  { value: 2, label: 'Can Do in Practice' },
  { value: 3, label: 'Can Use in Match' },
  { value: 4, label: 'Reliable Under Pressure' },
  { value: 5, label: 'Advanced / Weapon' },
];

export function getSkillLevelLabel(value) {
  return skillLevelOptions.find((option) => option.value === Number(value))?.label ?? 'Not Started';
}
