import type { TeamMemberView } from "@/features/content/queries";

// These names come from the supplied, individually named crew photos. We only
// state that they are D-Team members; specific roles and bios belong in the CMS.
const namedCrew = [
  ["junman", "Junman"],
  ["daniel", "Daniel"],
  ["danikono", "Dani Kono"],
  ["dann", "Dann"],
  ["deborah", "Deborah"],
  ["dembo", "Dembo"],
  ["esther", "Esther"],
  ["godwin", "Godwin"],
  ["harry", "Harry"],
  ["humble", "Humble"],
  ["ini", "Ini"],
  ["inimfon", "Inimfon"],
  ["isreal", "Isreal"],
  ["joel", "Joel"],
  ["josh", "Josh"],
  ["joshua", "Joshua"],
  ["kemi", "Kemi"],
  ["kindness", "Kindness"],
  ["lyta", "Lyta"],
  ["mercy", "Mercy"],
  ["metiro", "Metiro"],
  ["pmercy", "P. Mercy"],
  ["psaviour", "P. Saviour"],
  ["saviour", "Saviour"],
  ["watson", "Watson"],
  ["wisdom", "Wisdom"],
  ["zaddy", "Zaddy"],
  ["cbrownson", "C. Brownson"],
  ["ekeminijpg", "Ekemini"],
  ["supplyer", "Supplyer"],
] as const;

export const namedPortraitChoices = [
  ...namedCrew.map(([file, name]) => ({
    path: file === "ekeminijpg" ? "/ekemini.jpg" : `/${file}.jpg`,
    name,
    label: `${name} · ${file === "ekeminijpg" ? "ekemini.jpg" : file}`,
  })),
  { path: "/junmalead.JPG", name: "Junman", label: "Junman · junmalead.JPG" },
  { path: "/junman.JPG", name: "Junman", label: "Junman · junman.JPG" },
  { path: "/junman2.jpg", name: "Junman", label: "Junman · junman2.jpg" },
  { path: "/esther1.jpg", name: "Esther", label: "Esther · esther1.jpg" },
  { path: "/kindness2.jpg", name: "Kindness", label: "Kindness · kindness2.jpg" },
  { path: "/mercy1.jpg", name: "Mercy", label: "Mercy · mercy1.jpg" },
  { path: "/metrio2.jpg", name: "Metiro", label: "Metiro · metrio2.jpg" },
  { path: "/watson2.jpg", name: "Watson", label: "Watson · watson2.jpg" },
];

export const namedCrewRoster: TeamMemberView[] = namedCrew.map(([file, name], index) => ({
  id: `named-${file}`,
  slug: file,
  name,
  role: "Crew member",
  department: "D—TEAM",
  bio: null,
  portraitUrl: file === "ekeminijpg" ? "/ekemini.jpg" : `/${file}.jpg`,
  status: "published",
  sortOrder: index,
}));
