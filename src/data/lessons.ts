import type { GuidedLesson } from "../types";

export const guidedLessons: GuidedLesson[] = [
  {
    id: "hydrogen-sharing",
    title: "Hydrogen shares electrons",
    presetId: "h2",
    focus: "Single nonpolar covalent bond",
    steps: [
      "Two hydrogen atoms approach with one valence electron each.",
      "When their outer regions overlap, a shared electron pair appears between them.",
      "Because both atoms attract electrons equally, the bond is nonpolar covalent."
    ]
  },
  {
    id: "salt-transfer",
    title: "Sodium transfers to chlorine",
    presetId: "nacl",
    focus: "Ionic electron transfer",
    steps: [
      "Sodium has one loosely held valence electron; chlorine needs one electron.",
      "As they approach, the electron transfer animation moves from sodium to chlorine.",
      "Na+ and Cl- attract because opposite charges pull together."
    ]
  },
  {
    id: "water-polarity",
    title: "Why water is polar",
    presetId: "h2o",
    focus: "Polar covalent bonds and bent shape",
    steps: [
      "Oxygen bonds to two hydrogens by sharing electron pairs.",
      "Oxygen pulls harder on each shared pair, so the O side becomes partially negative.",
      "The bent shape means the partial charges do not cancel, making water polar."
    ]
  },
  {
    id: "metal-electrons",
    title: "Metallic electron sea",
    presetId: "metallic-na",
    focus: "Delocalized electrons",
    steps: [
      "Sodium atoms settle into a regular lattice.",
      "Their valence electrons are shown moving through the whole structure.",
      "Mobile electrons explain why metals conduct electricity and can bend without shattering."
    ]
  }
];
