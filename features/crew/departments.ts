export const crewDepartments = [
  "Production",
  "Direction",
  "Camera",
  "Photography",
  "Sound",
  "Lighting",
  "LED & Video",
  "Livestream",
  "Content & Social",
  "Design & Motion",
  "Front of House",
  "Post-production",
  "Technical",
] as const;

export type CrewDepartment = (typeof crewDepartments)[number];

export function isCrewDepartment(value: string): value is CrewDepartment {
  return (crewDepartments as readonly string[]).includes(value);
}
